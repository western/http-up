'use strict';

const os = require('os');
const fs = require('fs');
const url = require('url');
const urlencode = require('urlencode');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');
const mime = require('mime');
const shell = require('shelljs');
const exec = require('child_process').exec;

//const util = require('node:util');
//const exec = util.promisify(require('node:child_process').exec);


const util = require('./util');


const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');



function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

exports.api_thumb = (app, argv) => {
    
    let readFolder = argv.fold
    

    app.get('/__thumb/*', async (req, res) => {
        
        
        
        
        
        
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__thumb/, '');
        req_path = util.http_path_clear(req_path);
        
        
        
        //console.log('req_path=', req_path);
        

        //console.log('—'.repeat(process.stdout.columns));
        let name = util.get_name( req_path );
        let ext = util.get_ext_norm( req_path );
        
        
        let is_preview_match = ext.match(/(jpg|png|gif|pdf|rtf|doc|docx|xls|xlsx|odt|ods)/i);
        
        if (!is_preview_match){
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({ code: 500, msg: "Thumbnails support only for image format and office files" }));
            return
        }
        
        //console.log('=', path.join(readFolder, req_path));
        
        //let file_stat = fs.lstatSync(path.join(readFolder, req_path));
        
        //console.log('file_stat=', file_stat);
        
        
        let full_filename = path.join(readFolder, req_path);
        
        /*
        if (shell.exec('md5sum '+full_filename).code !== 0) {
            console.log('Error: easyrsa build-ca nopass');
            shell.exit(1);
            process.exit();
        }
        */
        
        let md5_file = "";
        
        /*
        await execute('md5sum '+full_filename, function(out){
            //console.log("out=", out);
            let arr = out.split(/\s+/);
            console.log("arr0=", arr[0]);
            md5_file = arr[0]
        });
        */
        
        let is_preview_img = ext.match(/(jpg|png|gif)/i);
        
        if (is_preview_img) {
            
            if ( !fs.existsSync(full_filename) ){
                
                res.status(404).send(util.error_page_content('404', '404 Not found'));

                let clp = util.common_log_prefix(req);
                console.log(clp, '404 Not found', chalk.yellow(full_filename));
                
                return;
            }
            
            
            if (shell.exec('convert --help', { silent: true }).code !== 0) {
                console.log('Error: convert not found');
                //shell.exit(1);
                //process.exit();
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: "convert not found" }));
                return;
            }
            
            if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
                console.log('Error: md5sum not found');
                //shell.exit(1);
                //process.exit();
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: "md5sum not found" }));
                return;
            }
            
            await exec('md5sum '+full_filename, function(error, stdout, stderr){
                
                
                //console.log("stdout=", stdout);
                //console.log("stderr=", stderr);
                let arr = stdout.split(/\s+/);
                //console.log("arr0=", arr[0]);
                md5_file = arr[0]
                
                //console.log("md5_file=", md5_file);
                
                
                if ( md5_file.length==0 ){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({ code: 500, msg: "error md5" }));
                    return;
                }
                
                let md5_file_path = path.join( httpup_thumb, md5_file );
                
                if ( fs.existsSync(md5_file_path) ){
                    let file_stat = fs.lstatSync(md5_file_path);
                    
                    if ( file_stat.size == 0 ){
                        fs.unlinkSync( md5_file_path )
                    }
                }
                
                
                if ( fs.existsSync(md5_file_path) ){
                    
                    //const data = fs.readFileSync(md5_file_path, { flag: 'r' });
                    
                    res.setHeader('Content-Type', mime.getType(ext));
                    //res.status(200).send(data);
                    
                    
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Thumbnail send ' + chalk.yellow(req_path));
                    
                    res.sendFile(md5_file_path);
                    return;
                }
                
                
                
                //console.log( `convert ${full_filename} -resize 600x-1 -quality 75 ${path.join( httpup_thumb, md5_file )}` );
                
                exec(`convert ${full_filename} -resize 600x-1 -quality 75 ${path.join( httpup_thumb, md5_file )}`, function(error, stdout, stderr){
                    
                    
                });
                
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Original send as thumbnail ' + chalk.yellow(req_path));
                
                
                res.sendFile(full_filename);
                return;
            });
        }
        
        
        let is_preview_doc = ext.match(/(pdf|rtf|doc|docx|xls|xlsx|odt|ods)/i);
        
        if (is_preview_doc) {
            
            
            if ( !fs.existsSync(full_filename) ){
                
                res.status(404).send(util.error_page_content('404', '404 Not found'));

                let clp = util.common_log_prefix(req);
                console.log(clp, '404 Not found', chalk.yellow(full_filename));
                
                return;
            }
            
            
            if (shell.exec('libreoffice --help', { silent: true }).code !== 0) {
                console.log('Error: libreoffice not found');
                //shell.exit(1);
                //process.exit();
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: "libreoffice not found" }));
                return;
            }
            
            if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
                console.log('Error: md5sum not found');
                //shell.exit(1);
                //process.exit();
                res.setHeader('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({ code: 500, msg: "md5sum not found" }));
                return;
            }
            
            await exec('md5sum '+full_filename, function(error, stdout, stderr){
                
                
                //console.log("stdout=", stdout);
                //console.log("stderr=", stderr);
                let arr = stdout.split(/\s+/);
                //console.log("arr0=", arr[0]);
                md5_file = arr[0]
                
                //console.log("md5_file=", md5_file);
                
                
                if ( md5_file.length==0 ){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({ code: 500, msg: "error md5" }));
                    return;
                }
                
                //console.log('full path=', path.join(httpup_thumb, md5_file));
                
                let md5_file_path = path.join( httpup_thumb, md5_file );
                
                if ( fs.existsSync(md5_file_path) ){
                    let file_stat = fs.lstatSync(md5_file_path);
                    
                    if ( file_stat.size == 0 ){
                        fs.unlinkSync( md5_file_path )
                    }
                }
                
                
                if ( fs.existsSync(md5_file_path) ){
                    
                    //const data = fs.readFileSync(md5_file_path, { flag: 'r' });
                    
                    //res.setHeader('Content-Type', mime.getType(ext));
                    res.setHeader('Content-Type', 'image/png');
                    //res.status(200).send(data);
                    
                    
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'Thumbnail send ' + chalk.yellow(req_path));
                    
                    res.sendFile(md5_file_path);
                    return;
                }
                
                
                
                
                //console.log( `libreoffice --headless --norestore --nologo --convert-to png --outdir ${httpup_thumb} "${full_filename}"` );
                
                exec(`libreoffice --headless --norestore --nologo --convert-to png --outdir ${httpup_thumb} "${full_filename}"`, function(error, stdout, stderr){
                    
                    
                    if ( fs.existsSync(path.join( httpup_thumb, name+".png" )) ){
                        
                        
                        fs.rename(path.join(httpup_thumb, name+".png"), md5_file_path, (err) => {
                            if (err) {
                                console.log('fs.rename', 'err=', err);
                            }
                        });
                    }
                });
                
                
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Thumbnail still preparing ' + chalk.yellow(req_path));
                
                
                //res.sendFile(full_filename);
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 200 }));
                return;
            });
        }
        
        
        
        
        
        
        
    });
};


