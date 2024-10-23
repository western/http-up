'use strict';

const fs = require('fs');
const url = require('url');
const urlencode = require('urlencode');
const colors = require('colors');
const path = require('path');
const cors = require('cors');

const config = require('./config');
const util = require('./util');


exports.api_upload = (app, argv) => {

    const multer = require('multer');
    const upload = multer({ dest: config.destination, limits: { fieldSize: config.fieldSize_max } });

    const flUpload = upload.fields([
        { name: 'fileBase', maxCount: config.files_count_max },
        { name: 'fileMeta', maxCount: config.files_count_max },
        { name: 'fileBlob', maxCount: config.files_count_max },
    ]);

    let corsOptions = {
        origin: (origin, callback) => {
            if (argv.origins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('"' + origin + '" Not allowed by CORS');
                callback('Not allowed by CORS');
            }
        },
    };

    app.post('/api/upload', cors(corsOptions), flUpload, async (req, res) => {

        let readFolder = argv.fold + url.parse(req.headers.referer).pathname;
        readFolder = urlencode.decode(readFolder);
        if (readFolder.slice(-1) != '/') {
            readFolder += '/';
        }
        readFolder = util.http_path_clear(readFolder);

        console.log('—'.repeat(process.stdout.columns));
        let clp = util.common_log_prefix(req);
        console.log(clp, 'Upload files to ' + colors.yellow(readFolder));

        //console.log('req.files=', req.files);

        if (typeof req.body.fileBase == 'object') {
            for (let a = 0; a < req.body.fileBase.length; a++) {
                let f = req.body.fileBase[a];
                let m = JSON.parse(req.body.fileMeta[a]);

                f = f.replace(/^data:(.+?);base64,/, '');
                m.name = m.name.replace(/[^0-9a-zа-я\-\_\. ]+/gi, '');

                var buf = Buffer.from(f, 'base64');
                fs.writeFile(readFolder + m.name, buf, 'binary', (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('File ' + colors.green(readFolder + m.name) + ' was saved');
                        console.log('Size: ' + colors.green(buf.length));
                        console.log('');
                    }
                });
            }
        } else if (typeof req.body.fileBase == 'string') {
            let f = req.body.fileBase;
            let m = JSON.parse(req.body.fileMeta);

            f = f.replace(/^data:(.+?);base64,/, '');
            m.name = m.name.replace(/[^0-9a-zа-я\-\_\. ]+/gi, '');

            var buf = Buffer.from(f, 'base64');
            fs.writeFile(readFolder + m.name, buf, 'binary', (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('File ' + colors.green(readFolder + m.name) + ' was saved');
                    console.log('Size: ' + colors.green(buf.length));
                    console.log('');
                }
            });
        } else if (typeof req.files.fileBlob == 'object') {
            let req_body_fileMeta = [];
            if (typeof req.body.fileMeta == 'string') {
                req_body_fileMeta.push(JSON.parse(req.body.fileMeta));
            } else if (typeof req.body.fileMeta == 'object') {
                req.body.fileMeta.forEach((el, indx) => {
                    req_body_fileMeta.push(JSON.parse(el));
                });
            }

            //console.log('req.files.fileBlob=', req.files.fileBlob);
            //console.log('req_body_fileMeta=', req_body_fileMeta);

            for (let a = 0; a < req.files.fileBlob.length; a++) {
                let f = req.files.fileBlob[a];
                let m = req_body_fileMeta[a];

                m.name = util.http_path_clear(m.name);
                let name = path.parse(m.name).name;
                let ext = path.parse(m.name).ext;

                // Chinese CJK Unified Ideographs (4E00-9FCC) [\u4E00-\u9FCC]
                // Japanese [\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]
                // Persian [\u0600-\u06FF]

                name = name.replace(/\s{1,}/g, '-');
                //name = name.replace(/[^0-9a-zа-яА-Я\-\_]+/gi, '');
                name = name.replace(
                    /[^0-9a-zа-я\-\_\u4E00-\u9FCC\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\u0600-\u06FF]+/gi,
                    '',
                );

                ext = ext.replace(/\./g, '');

                name += '.' + ext;

                fs.rename(f.path, readFolder + name, (err) => {
                    if (err) {
                        console.log('fs.rename', 'err=', err);
                    } else {
                        let clp = util.common_log_prefix(req);

                        console.log(clp, 'File ' + colors.green(readFolder + name) + ' was saved');
                        console.log(clp, 'Size: ' + colors.green(f.size));
                    }
                });
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ code: 200 }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};

exports.api_folder = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: config.destination, limits: { fieldSize: config.fieldSize_max } });

    const folderCreate = upload.fields([{ name: 'name', maxCount: 1 }]);

    let corsOptions = {
        origin: (origin, callback) => {
            if (argv.origins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('"' + origin + '" Not allowed by CORS');
                callback('Not allowed by CORS');
            }
        },
    };

    app.post('/api/folder', cors(corsOptions), folderCreate, async (req, res) => {

        let readFolder = argv.fold + url.parse(req.headers.referer).pathname;
        readFolder = urlencode.decode(readFolder);
        if (readFolder.slice(-1) != '/') {
            readFolder += '/';
        }
        readFolder = util.http_path_clear(readFolder);
        //console.log('readFolder=', readFolder);

        // without argv.fold
        let prefixFolder = url.parse(req.headers.referer).pathname;
        prefixFolder = urlencode.decode(prefixFolder);
        //console.log('prefixFolder=', prefixFolder);
        if (prefixFolder.slice(-1) != '/') {
            prefixFolder += '/';
        }
        prefixFolder = util.http_path_clear(prefixFolder);
        //console.log('prefixFolder=', prefixFolder);

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            // Chinese CJK Unified Ideographs (4E00-9FCC) [\u4E00-\u9FCC]
            // Japanese [\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]
            // Persian [\u0600-\u06FF]

            let clean_folder_name = util.http_path_clear(req.body.name);
            //clean_folder_name = clean_folder_name.replace(/[^0-9a-zа-я\-\_ ]+/gi, '');
            clean_folder_name = clean_folder_name.replace(
                /[^0-9a-zа-я\-\_ \u4E00-\u9FCC\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\u0600-\u06FF]+/gi,
                '',
            );

            let full_path = readFolder + clean_folder_name;

            if (clean_folder_name && clean_folder_name.length > 0 && fs.existsSync(full_path)) {
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Folder ' + colors.green(clean_folder_name) + ' for ' + colors.yellow(readFolder) + ' already exists');

                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: 'already exists' }));
                return;
            }

            if (clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync(full_path)) {
                fs.mkdirSync(full_path);

                let clp = util.common_log_prefix(req);
                console.log(clp, 'New folder ' + colors.green(clean_folder_name) + ' for ' + colors.yellow(readFolder) + ' created');

                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 200, result: prefixFolder + clean_folder_name }));
                return;
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};
