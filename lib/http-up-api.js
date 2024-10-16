

//const os = require('os');
const fs = require('fs');
const url = require('url');
const urlencode = require('urlencode');
const colors = require('colors');
const dateTime = require('node-datetime');

let config = require('./config');


function common_log_prefix(req){


    let client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    client_ip = client_ip.toString();

    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');

    return `[${client_ip}] [${formatted}]`;
}

exports.api_upload = function( app, argv ){

    //console.log('call api_upload function');


    const multer = require('multer');
    const upload = multer({ dest: config.destination, limits: { fieldSize: config.fieldSize_max } });

    const flUpload = upload.fields([
        { name: 'fileBase', maxCount: config.files_count_max },
        { name: 'fileMeta', maxCount: config.files_count_max },
        { name: 'fileBlob', maxCount: config.files_count_max },
    ]);

    app.post('/api/upload', flUpload, function (req, res) {
        let readFolder = argv.fold + url.parse(req.headers.referer).pathname;
        readFolder = urlencode.decode(readFolder);
        if (readFolder.slice(-1) != '/') {
            readFolder += '/';
        }

        console.log('—'.repeat(process.stdout.columns));
        let clp = common_log_prefix(req);
        console.log(clp, 'Upload files to ' + colors.yellow(readFolder));
        //console.log('');

        if (typeof req.body.fileBase == 'object') {
            for (let a = 0; a < req.body.fileBase.length; a++) {
                let f = req.body.fileBase[a];
                let m = JSON.parse(req.body.fileMeta[a]);

                f = f.replace(/^data:(.+?);base64,/, '');
                m.name = m.name.replace(/[^0-9a-zа-я\-\_\. ]+/gi, '');

                var buf = Buffer.from(f, 'base64');
                fs.writeFile(readFolder + m.name, buf, 'binary', function (err) {
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
            fs.writeFile(readFolder + m.name, buf, 'binary', function (err) {
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
                req.body.fileMeta.forEach(function (el, indx) {
                    req_body_fileMeta.push(JSON.parse(el));
                });
            }

            for (let a = 0; a < req.files.fileBlob.length; a++) {
                let f = req.files.fileBlob[a];
                let m = req_body_fileMeta[a];

                m.name = m.name.replace(/\s{1,}/g, '-');
                m.name = m.name.replace(/[^0-9a-zа-яА-Я\-\_\.]+/gi, '');

                /*
                fs.copyFile(f.path, readFolder + m.name, fs.constants.COPYFILE_EXCL, function (err) {
                    if (err) {
                        console.log('fs.copyFile', 'err=', err);
                    } else {
                        console.log('1The file ' + colors.green(readFolder + m.name) + ' was saved');
                        console.log('Size: ' + colors.green(f.size));
                        console.log('');
                    }
                });*/
                fs.rename(f.path, readFolder + m.name, function (err) {
                    if (err) {
                        console.log('fs.rename', 'err=', err);
                    } else {

                        let clp = common_log_prefix(req);
                        //console.log(clp, 'Upload files to ' + colors.yellow(readFolder));
                        console.log(clp, 'File ' + colors.green(readFolder + m.name) + ' was saved');
                        console.log(clp, 'Size: ' + colors.green(f.size));
                        //console.log('');
                    }
                });
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ code: 200 }));
    });


}


exports.api_folder = function( app, argv ){

    //console.log('call api_folder function');

    const multer = require('multer');
    const upload = multer({ dest: config.destination, limits: { fieldSize: config.fieldSize_max } });


    const folderCreate = upload.fields([
        { name: 'name', maxCount: 1 },

    ]);


    app.post('/api/folder', folderCreate, function (req, res) {
        let readFolder = argv.fold + url.parse(req.headers.referer).pathname;
        readFolder = urlencode.decode(readFolder);
        if (readFolder.slice(-1) != '/') {
            readFolder += '/';
        }
        console.log('—'.repeat(process.stdout.columns));
        let clp = common_log_prefix(req);
        console.log(clp, 'Make new folder for ' + colors.yellow(readFolder));
        //console.log('');


        if (typeof req.body.name == 'string') {

            let clean_folder_name = req.body.name;
            clean_folder_name = clean_folder_name.replace(/[^0-9a-zа-я\-\_ ]+/gi, '');

            let full_path = readFolder + clean_folder_name;

            if( clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync( full_path ) ){

                fs.mkdirSync( full_path );

                let clp = common_log_prefix(req);
                console.log(clp, 'Folder ' + colors.green(clean_folder_name) + ' created');
                //console.log('');
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ code: 200 }));
    });

}

