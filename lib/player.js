
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
//const shell = require('shelljs');
//const exec = require('child_process').exec;
//const process = require('process');
const chalk = require('chalk');


//const config = require('./config');
const util = require('./util');
const model = require(path.join(__dirname, '..', 'model', 'index'));





exports.player_page = (app, argv) => {
    
    app.get('/__player/*', async (req, res) => {
        
        
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__player/, '');
        req_path = util.http_path_clear(req_path);
        
        
        let readFolder = path.join(argv.fold, req_path);
        
        
        
        
        
        
        fs.readdir(readFolder, (err, files) => {
            
            if (err && err.code == 'ENOTDIR') {
                
                res.status(500).send(util.error_page_content('500', '500 This is not a directory'));
                
                model.event_log().write( req, 500, 'player', '500 This is not a directory ' + chalk.yellow(readFolder) );
                return;
            }

            if (err && err.code == 'ENOENT') {
                
                res.status(404).send(util.error_page_content('404', '404 Not found'));
                
                model.event_log().write( req, 404, 'player', '404 Not found ' + chalk.yellow(readFolder) );
                return;
            }

            
            
            
            
            let list = [];
            files.forEach((el, indx) => {
            
                let file = util.get_name(el);
                
            
                list.push( {
                    track: indx+1,
                    name: el,
                    length: "00:00",
                    file: file,
                })
                
            });
            
            
            
            
            
            model.event_log().write( req, 200, 'player', `Open player for "${req_path}"`);
            
            
            res.render('player', {
                files: list,
                mediapath: req_path,
            });
            
        });
        
        
        
        
        
        
        
        
    });
    
    
};
  
  
