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









exports.all_share = (app, argv) => {
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    

    app.post('/api/share', postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        
        

        console.log('—'.repeat(process.stdout.columns));
        
        
        
        if (typeof req.body.full_path == 'string') {
            
            
            let clean_full_path = util.http_path_clear(req.body.full_path);
            
            

            if (clean_full_path && clean_full_path.length > 0) {
                
                let src_file_path = path.join(argv.fold, clean_full_path);
                
                
                if ( !fs.existsSync(src_file_path) ){
                    
                    model.event_log().write( req, 404, 'api/share', 'Not found ' + chalk.yellow(src_file_path) );
                    
                    
                    res.status(404).json({ code: 404, msg: 'Not found '+clean_name });
                    return;
                }

                
                model.share().set_public_code( res, req, argv, src_file_path );
                return;
                
            }else{
                
                
                
                res.status(500).json({ code: 500 });
                return;
            }
            
        }
        

        if (typeof req.body.name == 'string') {
            
            
            let clean_name = util.http_path_clear(req.body.name);
            clean_name = clean_name.replace(/\//g, '');

            if (clean_name && clean_name.length > 0) {
                
                let src_file_path = path.join(readFolder, clean_name);
                
                
                if ( !fs.existsSync(src_file_path) ){
                    
                    model.event_log().write( req, 404, 'api/share', 'Not found ' + chalk.yellow(src_file_path) );
                    
                    
                    res.status(404).json({ code: 404, msg: 'Not found '+clean_name });
                    return;
                }

                
                model.share().set_public_code( res, req, argv, src_file_path );
                return;
                
            }else{
                
                
                
                res.status(500).json({ code: 500 });
                return;
            }
            
        }
        
        
        
        

        
        res.status(500).json({ code: 500 });
    });
    
    
    app.delete('/api/share', postProcessing, async (req, res) => {
        
        
        if (typeof req.body.code == 'string') {
            
            
            model.share().disable_share( res, req, req.body.code );
            return;
        }
        
        res.status(500).json({ code: 500, method: 'delete' });
    });
    
    app.get('/s/:code', async (req, res) => {
        
        
        model.share().get_file_bycode( res, req, req.params['code'], 'phase1' );
    });
    
    app.get('/s/:code/download', async (req, res) => {
        
        
        model.share().get_file_bycode( res, req, req.params['code'], 'phase2' );
    });
    
};



