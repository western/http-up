
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');
const urlencode = require('urlencode');
const chalk = require('chalk');
const dateTime = require('node-datetime');
//const mime = require('mime');
//const exec = require('child_process').exec;
const shell = require('shelljs');

//const config = require('./config');
//const util = require('./util');
const config = require(path.join(__dirname, '..', 'config'));
const util = require(path.join(__dirname, '..', 'util'));
const model = require(path.join(__dirname, '..', '..', 'model', 'index'));

const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');






exports.post_zip = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

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

            let file_list = [];
            let errors = [];

            req.body.name.forEach((el, indx) => {
                
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    
                    model.event_log().write( req, 200, 'api/zip', 'Zip ' + chalk.yellow(path.join(readFolder, clean_el)) );

                    file_list.push(path.join(clean_el));
                }
                
                let target_file_path = path.join(readFolder, clean_el);
                if (!fs.existsSync(target_file_path)) {
                    
                    model.event_log().write( req, 500, 'api/zip', 'File/folder ' + target_file_path + ' is not exist.' );

                    errors.push('Not found: '+clean_el);
                }
            });
            
            if (errors.length > 0) {
                
                res.status(500).json({ code: 500, msg: errors[0] });
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

            

            shell.cd(readFolder);

            if (shell.exec(`zip -0 -r ${temp_zip_full} ${file_list} `, { silent: true }).code !== 0) {
                
                model.event_log().write( req, 500, 'api/zip', 'zip error' );
                
                res.status(500).json({ code: 500 });
                return;
            }
            
            
            model.event_log().write( req, 200, 'api/zip', 'Zip out ' + chalk.yellow(temp_zip_full) );

            
            res.status(200).json({ code: 200, href: temp_zip });
            return;
        }

        
        res.status(500).json({ code: 500 });
    });
};

