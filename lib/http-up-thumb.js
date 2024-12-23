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
const dateTime = require('node-datetime');

//const util = require('node:util');
//const exec = util.promisify(require('node:child_process').exec);

const util = require('./util');
const model = require(path.join(__dirname, '..', 'model', 'index'));

const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');

/*
function execute(command, callback) {
    exec(command, function (error, stdout, stderr) {
        callback(stdout);
    });
}
*/

exports.api_thumb = (app, argv) => {
    let readFolder = argv.fold;

    app.get('/__thumb/*', async (req, res) => {
        
        
        
        
        
        
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__thumb/, '');
        req_path = util.http_path_clear(req_path);
        
        
        //let clp = util.common_log_prefix(req);
        //console.log(clp, 'req_path=', req_path);
        
        

        
        let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);

        let is_preview_match = ext.match(/^(jpg|png|gif|txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);

        if (!is_preview_match) {
            
            res.status(500).json({ code: 500, msg: 'Thumbnails support only for image format and office files' });
            return;
        }

        

        let full_filename_orig = path.join(readFolder, req_path);
        
        
        // --------------------------------------------------------------------------------------------------
        
        
        model.file().search(
            full_filename_orig,
            (row) => {
                
                
                
                //let clp = util.common_log_prefix(req);
                //console.log(clp, 'success, row found', full_filename_orig);
                
                let md5_file_path = path.join(httpup_thumb, row.md5);
                //console.log(clp, 'md5_file_path=', md5_file_path);
                
                if (fs.existsSync(md5_file_path)) {
                    let file_stat = fs.lstatSync(md5_file_path);

                    if (file_stat.size == 0) {
                        fs.unlinkSync(md5_file_path);
                    }
                }

                if (fs.existsSync(md5_file_path)) {
                    //const data = fs.readFileSync(md5_file_path, { flag: 'r' });

                    //res.setHeader('Content-Type', mime.getType(ext));
                    //res.status(200).send(data);
                    
                    
                    let is_preview_img = ext.match(/^(jpg|png|gif)$/i);
                    if(is_preview_img){
                        res.setHeader('Content-Type', mime.getType(ext));
                    }else{
                        res.setHeader('Content-Type', 'image/png');
                    }
                    
                    
                    
                    
                    model.event_log().attr('is_dbwrite', false).write( req, 200, 'thumb', 'sendFile', 'DB Thumbnail send ' + chalk.yellow(req_path) );

                    res.sendFile(md5_file_path);
                    return;
                }else{
                    
                    //let clp = util.common_log_prefix(req);
                    //console.log(clp, 'make new', full_filename_orig);
                    
                    let is_preview_img = ext.match(/^(jpg|png|gif)$/i);
                    if (is_preview_img) {
                        
                        exports.preview_img( argv, req, res, name, ext, full_filename_orig, req_path );
                    }
                    
                    let is_preview_doc = ext.match(/^(txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
                    if (is_preview_doc) {
                        
                        exports.preview_doc( argv, req, res, name, ext, full_filename_orig, req_path );
                    }
                }
                
            },
            () => {
                
                //console.log('fail');
                
                let is_preview_img = ext.match(/^(jpg|png|gif)$/i);
                if (is_preview_img) {
                    
                    exports.preview_img( argv, req, res, name, ext, full_filename_orig, req_path );
                }
                
                let is_preview_doc = ext.match(/^(txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
                if (is_preview_doc) {
                    
                    exports.preview_doc( argv, req, res, name, ext, full_filename_orig, req_path );
                }
            },
        );
        
        return;
        
        // --------------------------------------------------------------------------------------------------
        
        
        
        
        
        
        
        
    });
};




exports.preview_img = async ( argv, req, res, name, ext, full_filename_orig, req_path ) => {
    
    
    if (!fs.existsSync(full_filename_orig)) {
        
        
        model.event_log().write( req, 404, 'thumb', full_filename_orig );
        
        res.status(404).send(util.error_page_content('404', '404 Not found'));
        return;
    }
    
    if( argv.is_md5sum && argv.is_md5sum==2 ){
        
        model.event_log().write( req, 500, 'thumb', 'Error: md5sum not found' );
        
        
        res.status(500).json({ code: 500, msg: 'md5sum not found' });
        return;
    }
    
    // --------------------------------------------------------------------------------------------------
    
    
    if( !argv.is_md5sum ){
        if ( shell.exec('md5sum --help', { silent: true }).code !== 0 ) {
            
            model.event_log().write( req, 500, 'thumb', 'Error: md5sum not found' );
            
            
            res.status(500).json({ code: 500, msg: 'md5sum not found' });
            argv.is_md5sum = 2;
            return;
        }
        argv.is_md5sum = 1;
    }
    
    if( !argv.is_convert ){
        if (shell.exec('convert --help', { silent: true }).code !== 0) {
            
            model.event_log().write( req, 500, 'thumb', 'Error: convert not found' );
            
            
            res.status(500).json({ code: 500, msg: 'convert not found' });
            argv.is_convert = 2;
            return;
        }
        argv.is_convert = 1;
    }
    
    // --------------------------------------------------------------------------------------------------
    
    
    
    
    

    exec(`md5sum "${full_filename_orig}"`, function (error, stdout, stderr) {
        //console.log("stdout=", stdout);
        //console.log("stderr=", stderr);
        let arr = stdout.split(/\s+/);
        //console.log("arr0=", arr[0]);
        let md5_file = arr[0];

        

        if (md5_file.length == 0) {
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({ code: 500, msg: 'error md5' }));
            return;
        }
        
        
        
        let stats = fs.lstatSync(full_filename_orig);
        let modtime = dateTime.create(stats.mtime);
        let modtime_human = modtime.format('Y-m-d H:M:S');
        
        //res.locals.db.file_add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);
        model.file().add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);
        

        let md5_file_path = path.join(httpup_thumb, md5_file);

        if (fs.existsSync(md5_file_path)) {
            let file_stat = fs.lstatSync(md5_file_path);

            if (file_stat.size == 0) {
                fs.unlinkSync(md5_file_path);
            }
        }

        if (fs.existsSync(md5_file_path)) {
            //const data = fs.readFileSync(md5_file_path, { flag: 'r' });

            res.setHeader('Content-Type', mime.getType(ext));
            //res.status(200).send(data);

            
            model.event_log().attr('is_dbwrite', false).write( req, 200, 'thumb', 'sendFile', 'Thumbnail send ' + chalk.yellow(req_path) );

            res.sendFile(md5_file_path);
            return;
        }
        
        if( argv.is_convert && argv.is_convert==2 ){
            
            model.event_log().write( req, 500, 'thumb', 'Error: convert not found' );
            
            
            res.status(500).json({ code: 500, msg: 'convert not found' });
            return;
        }

        

        exec(`convert "${full_filename_orig}" -resize 600x-1 -quality 75 ${path.join(httpup_thumb, md5_file)}`, function (error, stdout, stderr) {});

        
        model.event_log().attr('is_dbwrite', false).write( req, 200, 'thumb', 'sendFile', 'Original send as thumbnail ' + chalk.yellow(req_path) );

        res.sendFile(full_filename_orig);
        return;
    });
    
};



exports.preview_doc = async ( argv, req, res, name, ext, full_filename_orig, req_path ) => {
    
    
    if (!fs.existsSync(full_filename_orig)) {
                
        
        model.event_log().write( req, 404, 'thumb', full_filename_orig );
        
        res.status(404).send(util.error_page_content('404', '404 Not found'));
        return;
    }
    
    if( argv.is_md5sum && argv.is_md5sum==2 ){
        
        model.event_log().write( req, 500, 'thumb', 'Error: md5sum not found' );
        
        
        res.status(500).json({ code: 500, msg: 'md5sum not found' });
        return;
    }
    
    // --------------------------------------------------------------------------------------------------
    
    
    if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
        
        model.event_log().write( req, 500, 'thumb', 'Error: md5sum not found' );
        
        
        res.status(500).json({ code: 500, msg: 'md5sum not found' });
        argv.is_md5sum = 2;
        return;
    }
    argv.is_md5sum = 1;

    if (shell.exec('libreoffice --help', { silent: true }).code !== 0) {
        
        model.event_log().write( req, 500, 'thumb', 'Error: libreoffice not found' );
        
        
        res.status(500).json({ code: 500, msg: 'libreoffice not found' });
        argv.is_libreoffice = 2;
        return;
    }
    argv.is_libreoffice = 1;
    
    // --------------------------------------------------------------------------------------------------
    
    
    
    

    exec(`md5sum "${full_filename_orig}"`, function (error, stdout, stderr) {
        //console.log("stdout=", stdout);
        //console.log("stderr=", stderr);
        let arr = stdout.split(/\s+/);
        //console.log("arr0=", arr[0]);
        let md5_file = arr[0];

        

        if (md5_file.length == 0) {
            
            res.status(500).json({ code: 500, msg: 'error md5' });
            return;
        }
        
        
        
        
        
        let stats = fs.lstatSync(full_filename_orig);
        let modtime = dateTime.create(stats.mtime);
        let modtime_human = modtime.format('Y-m-d H:M:S');
        
        //res.locals.db.file_add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);
        model.file().add(full_filename_orig, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_file);
        
        

        let md5_file_path = path.join(httpup_thumb, md5_file);

        if (fs.existsSync(md5_file_path)) {
            let file_stat = fs.lstatSync(md5_file_path);

            if (file_stat.size == 0) {
                fs.unlinkSync(md5_file_path);
            }
        }

        if (fs.existsSync(md5_file_path)) {
            //const data = fs.readFileSync(md5_file_path, { flag: 'r' });

            //res.setHeader('Content-Type', mime.getType(ext));
            res.setHeader('Content-Type', 'image/png');
            //res.status(200).send(data);

            
            model.event_log().attr('is_dbwrite', false).write( req, 200, 'thumb', 'sendFile', 'Thumbnail send ' + chalk.yellow(req_path) );

            res.sendFile(md5_file_path);
            return;
        }
        
        if( argv.is_libreoffice && argv.is_libreoffice==2 ){
            
            model.event_log().write( req, 500, 'thumb', 'Error: libreoffice not found' );
            
            
            res.status(500).json({ code: 500, msg: 'libreoffice not found' });
            return;
        }

        

        exec(
            `libreoffice --headless --norestore --nologo --convert-to png --outdir "${httpup_thumb}" "${full_filename_orig}"`,
            function (error, stdout, stderr) {
                if (fs.existsSync(path.join(httpup_thumb, name + '.png'))) {
                    fs.rename(path.join(httpup_thumb, name + '.png'), md5_file_path, (err) => {
                        if (err) {
                            
                            model.event_log().write( req, 500, 'thumb', 'fs.rename', 'err=', err );
                        }
                    });
                }
            },
        );

        
        model.event_log().attr('is_dbwrite', false).write( req, 200, 'thumb', 'Thumbnail still preparing ' + chalk.yellow(req_path) );

        //res.sendFile(full_filename_orig);
        
        res.status(200).json({ code: 200 });
        return;
    });
    
    
};

