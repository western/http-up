//import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
//import url from 'node:url';
//import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';


export const post_file = (app, argv) => {
    const upload = multer({
        dest: config.httpup_temp,
        limits: { fieldSize: config.fieldSize_max },
    });

    const postProcessing = upload.fields([{ name: 'fileBlob', maxCount: config.files_count_max }]);

    app.post('/api/file', postProcessing, async (req, res, next) => {
        let readFolder = path.join(argv.fold, util.get_referer_or_path(req));

        console.log('—'.repeat(process.stdout.columns));
        model.event_log.write(res, req, 200, 'api/file', 'Upload files to ' + chalk.yellow(readFolder));

        let promises = [];
        let errors = [];

        req.files.fileBlob.forEach((el, indx) => {
            let fileName = util.http_path_clear(el.originalname);
            fileName = fileName.replace(/\//g, '');
            let name = util.get_name(fileName);
            let ext = util.get_ext_norm(fileName);

            name = name.replace(/\s{1,}/g, '-');
            name = name.replace(/\-{2,}/g, '-');

            name += '.' + ext;

            let target_file_path = path.join(readFolder, name);

            let p = fs
                .copyFile(el.path, target_file_path)
                .then(() => {
                    model.event_log.write(res, req, 200, 'api/file', 'File ' + chalk.green(target_file_path) + ' was saved');
                })
                .catch((err) => {
                    errors.push(err.message);
                });

            promises.push(p);
        });

        await Promise.all(promises);

        if (errors.length > 0) {
            model.event_log.write(res, req, 500, 'api/file', errors[0]);
            res.status(500).json({ code: 500, msg: errors[0] });
            return;
        }

        res.status(200).json({ code: 200 });
        return;
    });
};
