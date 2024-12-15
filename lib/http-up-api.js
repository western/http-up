'use strict';

const os = require('os');
const fs = require('fs');
const url = require('url');
const urlencode = require('urlencode');
const path = require('path');
const cors = require('cors');
const shell = require('shelljs');
const dateTime = require('node-datetime');
const chalk = require('chalk');

const config = require('./config');
const util = require('./util');

const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');

exports.api_upload = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([
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

    app.post('/api/upload', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));
        let clp = util.common_log_prefix(req);
        console.log(clp, 'Upload files to ' + chalk.yellow(readFolder));

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
                        console.log('File ' + chalk.green(readFolder + m.name) + ' was saved');
                        console.log('Size: ' + chalk.green(buf.length));
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
                    console.log('File ' + chalk.green(readFolder + m.name) + ' was saved');
                    console.log('Size: ' + chalk.green(buf.length));
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

            for (let a = 0; a < req.files.fileBlob.length; a++) {
                let f = req.files.fileBlob[a];
                let m = req_body_fileMeta[a];

                m.name = util.http_path_clear(m.name);
                m.name = m.name.replace(/\//g, '');
                let name = util.get_name(m.name);
                let ext = util.get_ext_norm(m.name);

                // Chinese CJK Unified Ideographs (4E00-9FCC) [\u4E00-\u9FCC]
                // Japanese [\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]
                // Persian [\u0600-\u06FF]

                name = name.replace(/\s{1,}/g, '-');
                name = name.replace(/\-{2,}/g, '-');
                //name = name.replace(/[^0-9a-zа-яА-Я\-\_]+/gi, '');
                /*
                name = name.replace(
                    /[^0-9a-zа-я\-\_\u4E00-\u9FCC\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\u0600-\u06FF]+/gi,
                    '',
                );*/

                name += '.' + ext;

                let code = util.getcookie(req, 'code');

                if (!argv.crypt && code && code.length > 0) {
                    res.cookie('code', '');
                }

                if (argv.crypt && code && code.length > 0) {
                    util.CryptFile(f.path, code);

                    let to_name_crypt = path.join(readFolder, name + '.crypt');

                    fs.rename(f.path, to_name_crypt, (err) => {
                        if (err) {
                            console.log('fs.rename', 'err=', err);
                        } else {
                            let clp = util.common_log_prefix(req);
                            let to_stat = fs.lstatSync(to_name_crypt);

                            console.log(clp, 'File ' + chalk.green(to_name_crypt) + ' was encrypted and saved');
                            console.log(clp, 'Size: ' + chalk.green(util.humanFileSize(to_stat.size)));
                        }
                    });
                } else {
                    let to_name = path.join(readFolder, name);

                    fs.rename(f.path, to_name, (err) => {
                        if (err) {
                            console.log('fs.rename', 'err=', err);
                        } else {
                            let clp = util.common_log_prefix(req);

                            console.log(clp, 'File ' + chalk.green(to_name) + ' was saved');
                            console.log(clp, 'Size: ' + chalk.green(util.humanFileSize(f.size)));
                        }
                    });
                }
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
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

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

    app.post('/api/folder', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        //console.log('readFolder=', readFolder);

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            // Chinese CJK Unified Ideographs (4E00-9FCC) [\u4E00-\u9FCC]
            // Japanese [\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]
            // Persian [\u0600-\u06FF]

            let clean_folder_name = util.http_path_clear(req.body.name);
            clean_folder_name = clean_folder_name.replace(/\//g, '');
            //clean_folder_name = clean_folder_name.replace(/[^0-9a-zа-я\-\_ ]+/gi, '');
            /*
            clean_folder_name = clean_folder_name.replace(
                /[^0-9a-zа-я\-\_ \u4E00-\u9FCC\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\u0600-\u06FF]+/gi,
                '',
            );
            */
            //console.log('clean_folder_name=', clean_folder_name);

            let full_path = path.join(readFolder, clean_folder_name);
            //console.log('full_path=', full_path);

            if (clean_folder_name && clean_folder_name.length > 0 && fs.existsSync(full_path)) {
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Folder ' + chalk.green(clean_folder_name) + ' for ' + chalk.yellow(readFolder) + ' already exists');

                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: 'already exists' }));
                return;
            }

            if (clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync(full_path)) {
                fs.mkdirSync(full_path);

                let clp = util.common_log_prefix(req);
                console.log(clp, 'New folder ' + chalk.green(full_path) + ' created');

                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 200 }));
                return;
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};

exports.api_delete = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

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

    app.post('/api/delete', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                let full_path = path.join(readFolder, clean_el);

                if (clean_el && clean_el.length > 0 && fs.existsSync(full_path)) {
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Delete ' + chalk.yellow(full_path));

                    fs.rmSync(full_path, { recursive: true, force: true });
                }
            });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({ code: 200 }));
    });
};

exports.api_move = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

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

    app.post('/api/move', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        let to = '';
        if (req.body.to) {
            to = req.body.to;
            to = util.http_path_clear(to);
        }
        if (to.length == 0) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({ code: 500, msg: '"To" param is empty' }));
            return;
        }

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    let src_file_path = path.join(readFolder, clean_el);
                    let target_file_path = path.join(argv.fold, to, clean_el);

                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Move ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));

                    if (fs.existsSync(target_file_path)) {
                        console.log(clp, 'File/folder ' + target_file_path + ' is exist. It will be replace.');

                        fs.rmSync(target_file_path, { recursive: true, force: true });
                    }

                    fs.rename(src_file_path, target_file_path, (err) => {
                        if (err) {
                            console.log(clp, 'Rename err=', err);
                        }
                        //console.log(clp, 'Rename done');
                    });
                }
            });

            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({ code: 200 }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};

exports.api_copy = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

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

    app.post('/api/copy', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        let to = '';
        if (req.body.to) {
            to = req.body.to;
            to = util.http_path_clear(to);
        }
        if (to.length == 0) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({ code: 500, msg: '"To" param is empty' }));
            return;
        }

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    let src_file_path = path.join(readFolder, clean_el);
                    let target_file_path = path.join(argv.fold, to, clean_el);

                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Copy ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));

                    if (fs.existsSync(target_file_path)) {
                        console.log(clp, 'File/folder ' + target_file_path + ' is exist. It will be replace.');

                        fs.rmSync(target_file_path, { recursive: true, force: true });
                    }

                    fs.cp(src_file_path, target_file_path, { recursive: true }, (err) => {
                        if (err) {
                            console.log(clp, 'Copy err=', err);
                        }
                        //console.log(clp, 'Copy done');
                    });
                }
            });

            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({ code: 200 }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};

exports.api_zip = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

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

    app.post('/api/zip', cors(corsOptions), postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            let file_list = [];

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Zip ' + chalk.yellow(path.join(readFolder, clean_el)));

                    file_list.push(path.join(clean_el));
                }
            });

            let temp_zip = 'archive-';

            let dt = dateTime.create();
            let formatted = dt.format('Ymd-HMS');
            temp_zip += formatted;
            temp_zip += '.zip';

            let temp_zip_full = path.join(httpup_temp, temp_zip);

            file_list = file_list.join('" "');
            file_list = '"' + file_list + '"';

            let clp = util.common_log_prefix(req);
            console.log(clp, 'Zip out file ' + chalk.yellow(temp_zip_full));

            shell.cd(readFolder);

            if (shell.exec(`zip -r ${temp_zip_full} ${file_list} `, { silent: true }).code !== 0) {
                console.log('zip error');

                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500 }));
                return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({ code: 200, href: temp_zip }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};
