import fsSync from 'node:fs';
import fs from 'node:fs/promises';

import path from 'node:path';
import url from 'url';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';
import * as dateTime from 'node-datetime';

import which from 'which';
import archiver from 'archiver';

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_zip = (app, argv) => {
    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/zip', postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            let entity_list = [];
            let errors = [];

            for (const entityName of req.body.name) {
                let entityNameClear = util.http_path_clear(entityName);
                entityNameClear = entityNameClear.replace(/\//g, '');

                let readTarget = path.join(readFolder, entityNameClear);

                if (entityNameClear && entityNameClear.length > 0) {
                    model.event_log.write(res, req, 200, 'api/zip', 'Zip ' + chalk.yellow(readTarget));

                    entity_list.push(entityNameClear);
                }

                if (!fsSync.existsSync(readTarget)) {
                    model.event_log.write(res, req, 500, 'api/zip', 'File/folder ' + readTarget + ' is not exist.');

                    errors.push('Not found: ' + entityNameClear);
                }
            }

            if (errors.length > 0) {
                res.status(500).json({ code: 500, msg: errors[0] });
                return;
            }

            const isZipCmdExist = which.sync('zip', { nothrow: true });
            if (isZipCmdExist) {
                makeArchiveUtil2(req, res, readFolder, entity_list);
            } else {
                makeNodeArchiver(req, res, readFolder, entity_list);
            }
        } else {
            model.event_log.write(res, req, 500, 'api/zip', 'Name is required param');
            res.status(500).json({ code: 500, msg: 'Name is required param' });
        }
    });
};

let makeArchiveUtil2 = async (req, res, readFolder, entity_list) => {
    //console.log('makeArchiveUtil2 run');

    let temp_zip = generateZipFilename();
    let temp_zip_full = path.join(config.httpup_temp, temp_zip);

    try {
        let entity_list_str = entity_list.join('" "');
        entity_list_str = '"' + entity_list_str + '"';

        const command = `cd "${readFolder}" && zip -0 -r "${temp_zip_full}" ${entity_list_str} `;

        execAsync(command)
            .then(async (out) => {
                model.event_log.write(res, req, 200, 'makeArchiveUtil2', 'Zip out ' + chalk.yellow(temp_zip_full));
                res.status(200).json({ code: 200, file: temp_zip });
            })
            .catch((err) => {
                res.status(500).json({ code: 500, msg: err.stderr });
                console.log('makeArchiveUtil2 err=', err.stdout);
            });
    } catch (err) {
        res.status(500).json({ code: 500 });
        console.error('makeArchiveUtil2: Failed to run execAsync:', err);
    }
};

let makeNodeArchiver = async (req, res, readFolder, entity_list) => {
    //console.log('makeNodeArchiver run');

    let temp_zip = generateZipFilename();
    let temp_zip_full = path.join(config.httpup_temp, temp_zip);

    // ---------------------------------------------------------------------------------------------------------

    const output = fsSync.createWriteStream(temp_zip_full);
    const archive = archiver('zip', {
        zlib: {
            level: 0,
        },
    });

    archive.on('error', function (err) {
        if (err && err.code && err.code == 'ENOENT') {
            model.event_log.write(res, req, 404, 'makeNodeArchiver', 'Not found ' + chalk.yellow(err.path));
            if (!res.headersSent) {
                res.status(404).json({ code: 404, msg: 'Not found "' + path.basename(err.path) + '"' });
            }
            return;
        }
        if (err && err.code && err.code == 'EACCES') {
            model.event_log.write(res, req, 403, 'makeNodeArchiver', 'Forbidden ' + chalk.yellow(err.path));
            if (!res.headersSent) {
                res.status(403).json({ code: 403, msg: 'Forbidden "' + path.basename(err.path) + '"' });
            }
            return;
        }

        //throw err;
        model.event_log.write(res, req, 500, 'makeNodeArchiver', 'Internal Server Error', err);
        if (!res.headersSent) {
            res.status(500).json({ code: 500, msg: 'Something wrong' });
        }
    });

    archive.pipe(output);

    // ---------------------------------------------------------------------------------------------------------

    for (const entityName of entity_list) {
        let readTarget = path.join(readFolder, entityName);

        let st = fsSync.statSync(readTarget);
        if (st.isFile()) {
            archive.file(readTarget, {
                name: entityName,
            });
        }

        if (st.isDirectory()) {
            archive.directory(readTarget, entityName);
        }
    }

    // ---------------------------------------------------------------------------------------------------------

    await archive.finalize();

    // ---------------------------------------------------------------------------------------------------------

    if (res.headersSent) {
        console.log('already wrong inside Archive object');
    } else {
        model.event_log.write(res, req, 200, 'makeNodeArchiver', 'Zip out ' + chalk.yellow(temp_zip_full));
        res.status(200).json({ code: 200, file: temp_zip });
    }
};

let generateZipFilename = () => {
    let temp_zip = 'archive-';

    let dt = dateTime.create();
    let formatted = dt.format('Ymd-HMS');
    temp_zip += formatted;
    temp_zip += '.zip';

    return temp_zip;
};
