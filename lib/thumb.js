import os from 'os';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as urlencode from 'urlencode';
import * as dateTime from 'node-datetime';
import mime from 'mime';
import shell from 'shelljs';
import { exec } from 'child_process';

import config from '../lib/config.js';
import * as util from '../lib/util.js';
import * as model from '../model/index.js';

export const api_thumb = (app, argv) => {
    app.get('/__thumb/*splat', async (req, res, next) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__thumb/, '');
        req_path = util.http_path_clear(req_path);

        //res.locals.argv = argv;
        res.locals.req_path = req_path;

        //let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);

        let is_preview_match = ext.match(/^(jpg|png|gif|txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
        if (!is_preview_match) {
            res.status(500).json({ code: 500, msg: 'Thumbnails support only for image format and office files' });
            return;
        }

        // ---------------------------------------------------------------------

        let full_filename_orig = path.join(argv.fold, req_path);

        if (!fs.existsSync(full_filename_orig)) {
            model.event_log.write(res, req, 404, 'thumb', full_filename_orig);

            res.status(404).json({ code: 404, msg: '404 Not found' });
            return;
        }

        // ---------------------------------------------------------------------

        if (argv.usedb) {
            serve_with_db(req, res);
        } else {
            serve_without_db(req, res, ext);
        }
    });
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------

const serve_with_db = async (req, res) => {
    let argv = res.locals.argv;
    let req_path = res.locals.req_path;

    let full_filename_orig = path.join(argv.fold, req_path);
    //let ext = util.get_ext_norm(req_path);

    let db = model.connect();

    // --------------------------------------------------------------------------------------------------

    //model.file.md5_thumb_search( req, res, full_filename_orig )

    // --------------------------------------------------------------------------------------------------

    db.get(`select * from file where full_path =?`, [full_filename_orig], function (err, row) {
        if (err) {
            model.event_log.write(res, req, 500, 'thumb/serve_with_db', 'Internal Server ' + err);

            res.status(500).json({ code: 500, msg: 'Internal Server' });
            return;
        }

        if (row && row.md5) {
            let md5_full_path = path.join(config.httpup_thumb, row.md5);

            fs.readFile(md5_full_path, (err, data) => {
                if (err) {
                    model.event_log.write(res, req, 500, 'thumb/serve_with_db', 'Internal Server ' + err);

                    res.status(500).json({ code: 500, msg: 'Internal Server' });
                    return;
                }

                model.event_log.print(res, req, 200, 'thumb/serve_with_db', 'SendData thumb DB ' + chalk.yellow(full_filename_orig));

                const mime_type = mime.getType(row.ext);

                res.setHeader('content-type', mime_type);
                res.status(200).send(data);
                return;
            });
        } else {
            let ext = util.get_ext_norm(full_filename_orig);

            serve_without_db(req, res, ext);
            return;
        }
    });
};

const serve_without_db = async (req, res, ext) => {
    // --------------------------------------------------------------------------------------------------

    let is_preview_img = ext.match(/^(jpg|png|gif)$/i);
    if (is_preview_img) {
        preview_img(req, res);
        return;
    }

    let is_preview_doc = ext.match(/^(txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
    if (is_preview_doc) {
        preview_doc(req, res);
        return;
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------

const preview_img = async (req, res) => {
    let argv = res.locals.argv;
    let req_path = res.locals.req_path;

    let full_filename_orig = path.join(argv.fold, req_path);
    let ext = util.get_ext_norm(req_path);

    // --------------------------------------------------------------------------------------------------

    /*
    if (!fs.existsSync(full_filename_orig)) {
        model.event_log.write(res, req, 404, 'thumb/preview_img', full_filename_orig);

        res.status(404).json({ code: 404, msg: '404 Not found' });
        return;
    }
    */

    // --------------------------------------------------------------------------------------------------

    let stats = fs.lstatSync(full_filename_orig);

    if (stats.size && stats.size <= 50 * 1024) {
        model.event_log.print(res, req, 200, 'thumb/preview_img', 'SendFile orig without resize ' + full_filename_orig + ' size is small');

        const data = fs.readFileSync(full_filename_orig, { flag: 'r' });
        res.setHeader('Content-Type', mime.getType(ext));
        res.status(200).send(data);
        return;
    }

    // --------------------------------------------------------------------------------------------------

    if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
        model.event_log.write(res, req, 500, 'thumb/preview_img', 'Error: md5sum not found');

        res.status(500).json({ code: 500, msg: 'md5sum not found' });
        return;
    }

    if (shell.exec('convert --help', { silent: true }).code !== 0) {
        model.event_log.write(res, req, 500, 'thumb/preview_img', 'Error: convert not found');

        res.status(500).json({ code: 500, msg: 'convert not found' });
        return;
    }

    // --------------------------------------------------------------------------------------------------

    exec(`md5sum "${full_filename_orig}"`, function (error, stdout, stderr) {
        let arr = stdout.split(/\s+/);
        let md5_file = arr[0];

        if (md5_file.length == 0) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({ code: 500, msg: 'error md5' }));
            return;
        }

        let stats = fs.lstatSync(full_filename_orig);
        let modtime = dateTime.create(stats.mtime);
        let modtime_human = modtime.format('Y-m-d H:M:S');

        //model.file.add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);

        let md5_file_path = path.join(config.httpup_thumb, md5_file);

        if (fs.existsSync(md5_file_path)) {
            let file_stat = fs.lstatSync(md5_file_path);

            if (file_stat.size == 0) {
                fs.unlinkSync(md5_file_path);
            }
        }

        if (fs.existsSync(md5_file_path)) {
            const data = fs.readFileSync(md5_file_path, { flag: 'r' });

            res.setHeader('Content-Type', mime.getType(ext));
            res.status(200).send(data);

            model.event_log.print(res, req, 200, 'thumb/preview_img', 'sendFile', 'Thumbnail send ' + chalk.yellow(req_path));

            //res.sendFile(md5_file_path);
            return;
        }

        exec(`convert "${full_filename_orig}" -resize 600x-1 -quality 75 ${path.join(config.httpup_thumb, md5_file)}`, function (error, stdout, stderr) {});

        model.event_log.print(res, req, 200, 'thumb/preview_img', 'sendFile', 'Original send as thumbnail ' + chalk.yellow(req_path));

        res.sendFile(full_filename_orig);
        //res.status(200).json({ code: 200, msg: 'Thumbnail is still not ready' });
        return;
    });
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------

const preview_doc = async (req, res) => {
    let argv = res.locals.argv;
    let req_path = res.locals.req_path;

    let full_filename_orig = path.join(argv.fold, req_path);
    let ext = util.get_ext_norm(req_path);

    // --------------------------------------------------------------------------------------------------

    if (!fs.existsSync(full_filename_orig)) {
        model.event_log.write(res, req, 404, 'thumb/preview_doc', full_filename_orig);

        res.status(404).json({ code: 404, msg: '404 Not found' });
        return;
    }

    // --------------------------------------------------------------------------------------------------

    if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
        model.event_log.write(res, req, 500, 'thumb/preview_doc', 'Error: md5sum not found');

        res.status(500).json({ code: 500, msg: 'md5sum not found' });
        return;
    }

    if (shell.exec('libreoffice --help', { silent: true }).code !== 0) {
        model.event_log.write(res, req, 500, 'thumb/preview_doc', 'Error: libreoffice not found');

        res.status(500).json({ code: 500, msg: 'libreoffice not found' });
        return;
    }

    // --------------------------------------------------------------------------------------------------

    exec(`md5sum "${full_filename_orig}"`, function (error, stdout, stderr) {
        let arr = stdout.split(/\s+/);
        let md5_file = arr[0];

        if (md5_file.length == 0) {
            res.status(500).json({ code: 500, msg: 'error md5' });
            return;
        }

        let stats = fs.lstatSync(full_filename_orig);
        let modtime = dateTime.create(stats.mtime);
        let modtime_human = modtime.format('Y-m-d H:M:S');

        //model.file.add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);

        let md5_file_path = path.join(config.httpup_thumb, md5_file);

        if (fs.existsSync(md5_file_path)) {
            let file_stat = fs.lstatSync(md5_file_path);

            if (file_stat.size == 0) {
                fs.unlinkSync(md5_file_path);
            }
        }

        if (fs.existsSync(md5_file_path)) {
            const data = fs.readFileSync(md5_file_path, { flag: 'r' });

            //res.setHeader('Content-Type', mime.getType(ext));
            res.setHeader('Content-Type', 'image/png');
            res.status(200).send(data);

            model.event_log.print(res, req, 200, 'thumb/preview_doc', 'sendFile', 'Thumbnail send ' + chalk.yellow(req_path));

            //res.sendFile(md5_file_path);
            return;
        }

        exec(
            `libreoffice --headless --norestore --nologo --convert-to png --outdir "${config.httpup_thumb}" "${full_filename_orig}"`,
            function (error, stdout, stderr) {
                let name = util.get_name(req_path);
                let png_file = path.join(config.httpup_thumb, name + '.png');

                if (fs.existsSync(png_file)) {
                    fs.rename(png_file, md5_file_path, (err) => {
                        if (err) {
                            model.event_log.write(res, req, 500, 'thumb/preview_doc', 'fs.rename', 'err=', err);
                        }
                    });
                }
            },
        );

        model.event_log.print(res, req, 200, 'thumb/preview_doc', 'Thumbnail still preparing ' + chalk.yellow(req_path));

        res.status(200).json({ code: 200 });
        return;
    });
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
