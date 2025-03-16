
'use strict';

const os = require('os');
const fs = require('fs');
const url = require('url');
const urlencode = require('urlencode');
const path = require('path');
//const cors = require('cors');
//const shell = require('shelljs');
//const dateTime = require('node-datetime');
const chalk = require('chalk');

//const config = require('./config');
//const util = require('./util');
const config = require(path.join(__dirname, '..', 'config'));
const util = require(path.join(__dirname, '..', 'util'));
const model = require(path.join(__dirname, '..', '..', 'model', 'index'));




const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');



exports.post_file_upload = (app, argv) => {
    
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([
        
        { name: 'fileBlob', maxCount: config.files_count_max },
    ]);

    

    app.post('/api/file/upload', postProcessing, async (req, res) => {
        
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));
        model.event_log().write( req, 200, 'api/upload', 'Upload files to ' + chalk.yellow(readFolder) );

        
        
        
        
            
        let req_body_fileMeta = [];
        if (typeof req.body.fileMeta == 'string') {
            req_body_fileMeta.push(JSON.parse(req.body.fileMeta));
        } else if (typeof req.body.fileMeta == 'object') {
            req.body.fileMeta.forEach((el, indx) => {
                req_body_fileMeta.push(JSON.parse(el));
            });
        }
        
        let errors = [];

        
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

                
                if (fs.existsSync(target_file_path_crypt)) {
                    
                    
                    
                    try{
                        fs.rmSync(target_file_path_crypt, { recursive: false, force: false });
                        
                        model.event_log().write( req, 200, 'api/upload', 'File ' + target_file_path_crypt + ' is exist. It will be replace.' );
                        
                    }catch(e){
                        
                        model.event_log().write( req, 500, 'api/upload', 'Delete error: ', e.toString() );
                        
                        errors.push('Delete error: '+name + '.crypt');
                    }
                }
                
                
                try{
                    fs.renameSync(el.path, target_file_path_crypt);
                    
                    
                    
                    model.event_log().write( req, 200, 'api/upload', 'File ' + chalk.green(target_file_path_crypt) + ' was saved' );
                    
                    
                    
                }catch(e){
                    
                    model.event_log().write( req, 500, 'api/upload', 'Rename error2: ', e.toString() );
                    
                    errors.push('Rename error2: '+name + '.crypt');
                }
                
                
            } else {
                
                let target_file_path = path.join(readFolder, name);
                
                if (fs.existsSync(target_file_path)) {
                    
                    
                    
                    try{
                        fs.rmSync(target_file_path, { recursive: false, force: false });
                        
                        model.event_log().write( req, 200, 'api/upload', 'File ' + target_file_path + ' is exist. It will be replace.' );
                        
                    }catch(e){
                        
                        model.event_log().write( req, 500, 'api/upload', 'Delete error: ', e.toString() );
                        
                        errors.push('Delete error: '+name);
                    }
                }

                
                try{
                    fs.renameSync(el.path, target_file_path);
                    
                    
                    model.event_log().write( req, 200, 'api/upload', 'File ' + chalk.green(target_file_path) + ' was saved' );
                    
                    
                }catch(e){
                    
                    model.event_log().write( req, 500, 'api/upload', 'Rename error: ', e.toString() );
                    
                    errors.push('Rename error: '+name);
                }
            }
            
        });
        
        
        
        if (errors.length > 0) {
            
            res.status(500).json({ code: 500, msg: errors[0] });
            return;
        }
        

        
        res.status(200).json({ code: 200 });
        return;
        
    
    });
};



