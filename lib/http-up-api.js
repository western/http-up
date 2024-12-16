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
            
            let errors = [];

            //for (let a = 0; a < req.files.fileBlob.length; a++) {
            req.files.fileBlob.forEach((el, indx) => {
                
                
                let m = req_body_fileMeta[indx];

                m.name = util.http_path_clear(m.name);
                m.name = m.name.replace(/\//g, '');
                let name = util.get_name(m.name);
                let ext = util.get_ext_norm(m.name);
                
                name = name.replace(/\s{1,}/g, '-');
                name = name.replace(/\-{2,}/g, '-');

                name += '.' + ext;
                
                
                

                let code = util.getcookie(req, 'code');

                if (!argv.crypt && code && code.length > 0) {
                    res.cookie('code', '');
                }

                if (argv.crypt && code && code.length > 0) {
                    
                    util.CryptFile(el.path, code);

                    let target_file_path_crypt = path.join(readFolder, name + '.crypt');

                    fs.rename(el.path, target_file_path_crypt, (err) => {
                        if (err) {
                            console.log('fs.rename', 'err=', err);
                            
                            errors.push('fs.rename error: '+name+'.crypt');
                        } else {
                            let clp = util.common_log_prefix(req);
                            let to_stat = fs.lstatSync(target_file_path_crypt);

                            console.log(clp, 'File ' + chalk.green(target_file_path_crypt) + ' was encrypted and saved');
                            console.log(clp, 'Size: ' + chalk.green(util.humanFileSize(to_stat.size)));
                        }
                    });
                } else {
                    
                    let target_file_path = path.join(readFolder, name);
                    
                    if (fs.existsSync(target_file_path)) {
                        console.log(clp, 'File ' + target_file_path + ' is exist. It will be replace.');
                        
                        try{
                            fs.rmSync(target_file_path, { recursive: false, force: false });
                        }catch(e){
                            let clp = util.common_log_prefix(req);
                            console.log(clp, 'Delete error: ', e.toString());
                            
                            errors.push('Delete error: '+name);
                        }
                    }

                    fs.rename(el.path, target_file_path, (err) => {
                        if (err) {
                            console.log('fs.rename', 'err=', err);
                            
                            errors.push('fs.rename error: '+name);
                        } else {
                            let clp = util.common_log_prefix(req);

                            console.log(clp, 'File ' + chalk.green(target_file_path) + ' was saved');
                            console.log(clp, 'Size: ' + chalk.green(util.humanFileSize(el.size)));
                        }
                    });
                }
                
            });
            
            
            
            if (errors.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: errors[0] }));
                return;
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

        

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            
            let clean_folder_name = util.http_path_clear(req.body.name);
            clean_folder_name = clean_folder_name.replace(/\//g, '');
            
            

            let full_path = path.join(readFolder, clean_folder_name);
            

            if (clean_folder_name && clean_folder_name.length > 0 && fs.existsSync(full_path)) {
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Folder ' + chalk.green(clean_folder_name) + ' for ' + chalk.yellow(readFolder) + ' already exists');

                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: 'Already exists: '+clean_folder_name }));
                return;
            }

            if (clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync(full_path)) {
                
                
                try {
                    fs.mkdirSync(full_path);
                }catch(e){
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Mkdir error: ', e.toString());
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({ code: 500, msg: 'Mkdir error' }));
                    return;
                }
                
                

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
            
            let errors = [];
            
            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                let target_file_path = path.join(readFolder, clean_el);
                
                if ( !fs.existsSync(target_file_path) ){
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Not found ' + chalk.yellow(target_file_path));
                    
                    errors.push('Not found: ' +clean_el);
                }
                
                
                if ( clean_el && clean_el.length > 0 && fs.existsSync(target_file_path) ) {
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Delete ' + chalk.yellow(target_file_path));
                    
                    try {
                        fs.rmSync(target_file_path, { recursive: true, force: false });
                    }catch(e){
                        let clp = util.common_log_prefix(req);
                        console.log(clp, 'Delete error: ', e.toString());
                        
                        errors.push('Delete error: '+clean_el);
                    }
                }else{
                    
                    errors.push('Problem with: '+clean_el);
                }
            });
            
            
            if (errors.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: errors[0] }));
                return;
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({ code: 200 }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
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
            
            let errors = [];

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    
                    let src_file_path = path.join(readFolder, clean_el);
                    let target_file_path = path.join(argv.fold, to, clean_el);
                    
                    
                    if ( !fs.existsSync(src_file_path) ){
                        let clp = util.common_log_prefix(req);
                        console.log(clp, 'Not found ' + chalk.yellow(src_file_path));
                        
                        errors.push('Not found: ' +path.join(  clean_el));
                    }
                    

                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Move ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));

                    if (fs.existsSync(target_file_path)) {
                        console.log(clp, 'File/folder ' + target_file_path + ' is exist. It will be replace.');
                        
                        try{
                            fs.rmSync(target_file_path, { recursive: true, force: false });
                        }catch(e){
                            let clp = util.common_log_prefix(req);
                            console.log(clp, 'Delete error: ', e.toString());
                            
                            errors.push('Delete error: '+path.join( to, clean_el));
                        }
                    }
                    
                    try{
                        fs.renameSync(src_file_path, target_file_path);
                    }catch(e){
                        let clp = util.common_log_prefix(req);
                        console.log(clp, 'Rename error: ', e.toString());
                        
                        errors.push('Rename error');
                    }
                    
                }else{
                    
                    errors.push('Problem with: '+clean_el);
                }
            });
            
            

            if (errors.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: errors[0] }));
                return;
            }
            
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
            
            let errors = [];

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    
                    let src_file_path = path.join(readFolder, clean_el);
                    let target_file_path = path.join(argv.fold, to, clean_el);
                    
                    if ( !fs.existsSync(src_file_path) ){
                        let clp = util.common_log_prefix(req);
                        console.log(clp, 'Not found ' + chalk.yellow(src_file_path));
                        
                        errors.push('Not found: ' +path.join(  clean_el));
                    }

                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Copy ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));

                    if (fs.existsSync(target_file_path)) {
                        console.log(clp, 'File/folder ' + target_file_path + ' is exist. It will be replace.');

                        //fs.rmSync(target_file_path, { recursive: true, force: true });
                        try{
                            fs.rmSync(target_file_path, { recursive: true, force: false });
                        }catch(e){
                            let clp = util.common_log_prefix(req);
                            console.log(clp, 'Delete error: ', e.toString());
                            
                            errors.push('Delete error: '+path.join( to, clean_el));
                        }
                    }

                    
                    try{
                        fs.cpSync(src_file_path, target_file_path, { recursive: true });
                    }catch(e){
                        let clp = util.common_log_prefix(req);
                        console.log(clp, 'Copy error: ', e.toString());
                        
                        errors.push('Copy error');
                    }
                    
                    
                }else{
                    
                    errors.push('Problem with: '+clean_el);
                }
                
            });
            
            

            if (errors.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: errors[0] }));
                return;
            }
            
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
            let errors = [];

            req.body.name.forEach((el, indx) => {
                
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Zip ' + chalk.yellow(path.join(readFolder, clean_el)));

                    file_list.push(path.join(clean_el));
                }
                
                let target_file_path = path.join(readFolder, clean_el);
                if (!fs.existsSync(target_file_path)) {
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'File/folder ' + target_file_path + ' is not exist.');

                    errors.push('Not found: '+clean_el);
                }
            });
            
            if (errors.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: errors[0] }));
                return;
            }

            let temp_zip = 'archive-';

            let dt = dateTime.create();
            let formatted = dt.format('Ymd-HMS');
            temp_zip += formatted;
            temp_zip += '.zip';

            let temp_zip_full = path.join(httpup_temp, temp_zip);

            file_list = file_list.join('" "');
            file_list = '"' + file_list + '"';

            //let clp = util.common_log_prefix(req);
            //console.log(clp, 'Zip out ' + chalk.yellow(temp_zip_full));

            shell.cd(readFolder);

            if (shell.exec(`zip -r ${temp_zip_full} ${file_list} `, { silent: true }).code !== 0) {
                console.log('zip error');

                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500 }));
                return;
            }
            
            let clp = util.common_log_prefix(req);
            console.log(clp, 'Zip out ' + chalk.yellow(temp_zip_full));

            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify({ code: 200, href: temp_zip }));
            return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ code: 500 }));
    });
};
