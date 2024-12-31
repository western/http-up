
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const shell = require('shelljs');
const exec = require('child_process').exec;
//const process = require('process');


const config = require('./config');
const util = require('./util');
const model = require(path.join(__dirname, '..', 'model', 'index'));


const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');



exports.search_result = (app, argv) => {
    
    app.get('/__search/', async (req, res) => {
        
        
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        //req_path = req_path.replace(/^\/__search/, '');
        req_path = util.http_path_clear(req_path);
        
        
        let readFolder = argv.fold;
        //let full_filename_orig = path.join(readFolder, req_path);
        
        //let name = util.get_name(req_path);
        //let ext = util.get_ext_norm(req_path);
        
        
        let s = req.query.s;
        s = urlencode.decode(s);
        
        if( !s || s.length==0 ){
            res.status(500).send(util.error_page_content('500', 'Search param is empty'));
            return;
        }
        
        
        model.file().search_result(argv, res, s);
        
        
        model.event_log().write( req, 200, 'search', 'Open result page ' );
        return;
        
        
        
        
    });
    
    
  };
  
  
  