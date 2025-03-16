
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');
const urlencode = require('urlencode');
const chalk = require('chalk');
//const dateTime = require('node-datetime');
//const mime = require('mime');
//const exec = require('child_process').exec;

//const config = require('./config');
//const util = require('./util');
const config = require(path.join(__dirname, '..', 'config'));
const util = require(path.join(__dirname, '..', 'util'));
const model = require(path.join(__dirname, '..', '..', 'model', 'index'));

const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');



exports.post_folder = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    

    app.post('/api/folder', postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            
            let clean_folder_name = util.http_path_clear(req.body.name);
            clean_folder_name = clean_folder_name.replace(/\//g, '');
            
            

            let full_path = path.join(readFolder, clean_folder_name);
            

            if (clean_folder_name && clean_folder_name.length > 0 && fs.existsSync(full_path)) {
                
                model.event_log().write( req, 500, 'api/folder', 'Folder ' + chalk.green(clean_folder_name) + ' for ' + chalk.yellow(readFolder) + ' already exists' );

                
                res.status(500).json({ code: 500, msg: 'Already exists: '+clean_folder_name });
                return;
            }

            if (clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync(full_path)) {
                
                
                try {
                    fs.mkdirSync(full_path);
                    
                    model.event_log().write( req, 200, 'api/folder', 'New folder ' + chalk.green(full_path) + ' created' );
                    
                }catch(e){
                    
                    model.event_log().write( req, 500, 'api/folder', 'Mkdir error: ', e.toString() );
                    
                    res.status(500).json({ code: 500, msg: 'Mkdir error' });
                    return;
                }
                
                
                res.status(200).json({ code: 200 });
                return;
            }
        }

        
        res.status(500).json({ code: 500 });
    });
};



