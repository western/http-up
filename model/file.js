

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as dateTime from 'node-datetime';
import shell from 'shelljs';
import { exec } from 'child_process';
import mime from 'mime';


import config from '../lib/config.js';
import * as util from '../lib/util.js';
//import * as thumb from '../lib/thumb.js';
import * as model from '../model/index.js';



export const add = async ( res, full_path_arr ) => {
    
    
    
    let argv = res.locals.argv;
    
    if (!argv || !argv.usedb) {
        return;
    }
    
    let db = model.connect();
    
    if(!db ){
        return;
    }
    
    /*
    if(!full_path || full_path.length==0){
        console.log('add2:', 'full_path is required param');
        return;
    }*/
    
    if( full_path_arr.constructor === Array ){
    }else{
        console.log('model.file.add:', 'full_path_arr is required Array param');
        return;
    }
    
    // -------------------------------------------------------------------------------------------------
    
    /*
    
    db.each(`
        select *
        from file
        where full_path in ?
    `,
    [ full_path_arr ],
    (err, row) => {
        if(err){
            //console.log('select from file err: ', err);
            return;
        }
        
        console.log('row=', row);
        
        if( row && row.full_path && !fs.existsSync(row.full_path) ){
            
            let full_path = row.full_path;
            
            
            let stats = fs.lstatSync(full_path);
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');
            
            let filename = util.get_name(full_path);
            
            let ext = path.parse(full_path).ext;
            ext = ext.replace(/\./g, '');
            ext = ext.toLowerCase();
            
            
            
            let is_preview_img = ext.match(/^(jpg|jpeg|png|gif)$/i);
            let is_preview_doc = ext.match(/^(html|txt|js|css|md|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
            
            
            
            if(
                is_preview_img || is_preview_doc || stats.size < 20 * 1024 * 1024
            ){
                
                //console.log('add2:', full_path, 'with md5');
                
                exec(`md5sum "${full_path}"`, function (error, stdout, stderr) {
                        
                    let arr = stdout.split(/\s+/);
                    let md5_file = arr[0];
                    
                    if (md5_file.length == 0) {
                        console.log('add2:', 'error md5 for '+full_path);
                        return;
                    }
                    
                    
                    
                    db.run(
                        `insert into file (full_path, filename, ext, is_folder, size, modified, md5) values(?, ?, ?, ?, ?, ?, ?)`,
                        [ full_path, filename, ext, 0, stats.size, modtime_human, md5_file ],
                        (err) => {
                            if(err){
                                console.log('add2:', 'insert into file err=', err);
                            }
                        },
                    );
                });
                
            }else{
                
                // without md5
                //console.log('add2:', full_path, 'WITHOUT md5');
                
                db.run(
                    `insert into file (full_path, filename, ext, is_folder, size, modified, md5) values(?, ?, ?, ?, ?, ?, ?)`,
                    [ full_path, filename, ext, 0, stats.size, modtime_human, "" ],
                    (err) => {
                        if(err){
                            console.log('add2:', 'insert into file err=', err);
                        }
                    },
                );
                
            }
    
        }
    });
    
    */
    
    
    // -------------------------------------------------------------------------------------------------
    
    
    for(let a=0; a<full_path_arr.length; a++){
        
        let full_path = full_path_arr[a];
        
        db.get(`select * from file where full_path =?`, [ full_path ], function(err, row){
            
            if(err){
                console.log('add2:', 'search err=', err);
                return;
            }
            
            if( !row ){
                
                // filename, ext, is_folder, size, modified, md5
                
                let stats = fs.lstatSync(full_path);
                let modtime = dateTime.create(stats.mtime);
                let modtime_human = modtime.format('Y-m-d H:M:S');
                
                let filename = util.get_name(full_path);
                
                let ext = path.parse(full_path).ext;
                ext = ext.replace(/\./g, '');
                ext = ext.toLowerCase();
                
                
                
                let is_preview_img = ext.match(/^(jpg|jpeg|png|gif)$/i);
                let is_preview_doc = ext.match(/^(html|txt|js|css|md|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
                
                
                
                if(
                    is_preview_img || is_preview_doc || stats.size < 20 * 1024 * 1024
                ){
                    
                    //console.log('add2:', full_path, 'with md5');
                    
                    exec(`md5sum "${full_path}"`, function (error, stdout, stderr) {
                            
                        let arr = stdout.split(/\s+/);
                        let md5_file = arr[0];
                        
                        if (md5_file.length == 0) {
                            console.log('add2:', 'error md5 for '+full_path);
                            return;
                        }
                        
                        
                        
                        db.run(
                            `insert into file (full_path, filename, ext, size, modified, md5) values(?, ?, ?, ?, ?, ?)`,
                            [ full_path, filename, ext, stats.size, modtime_human, md5_file ],
                            (err) => {
                                if(err){
                                    console.log('add2:', 'insert into file err=', err);
                                }
                            },
                        );
                    });
                    
                }else{
                    
                    // without md5
                    //console.log('add2:', full_path, 'WITHOUT md5');
                    
                    db.run(
                        `insert into file (full_path, filename, ext, size, modified, md5) values(?, ?, ?, ?, ?, ?)`,
                        [ full_path, filename, ext, stats.size, modtime_human, "" ],
                        (err) => {
                            if(err){
                                console.log('add2:', 'insert into file err=', err);
                            }
                        },
                    );
                    
                }
                
            }
        })
        
        
    
    }


}




export const add2 = async ( res, full_path_arr ) => {
    
    console.log();
    console.log('model.file add run');
    
    /*
    if(!full_path || full_path.length==0){
        console.log('model.file.add:', 'full_path is required param');
        return;
    }*/
    
    if( full_path_arr.constructor === Array ){
    }else{
        console.log('model.file.add:', 'full_path_arr is required Array param');
        return;
    }
    
    
    //let db = res.locals.db;
    let db = model.connect();
    let argv = res.locals.argv;
    
    if(!db ){
        return;
    }
    
    //db.exec('begin');
    
    // -----------------------------------------------------------------------------------
    
    
    const stmt_insrt = db.prepare(`insert into file (full_path, filename, ext, size, modified, md5) values(?, ?, ?, ?, ?, ?)`);
    
    
    
    
    for(let a=0; a<full_path_arr.length; a++){
        
        let full_path = full_path_arr[a];
        
        const stmt = db.prepare('select * from file where full_path=?');
        const row = stmt.get(full_path);
        
        if( !row ){
            
            let stats = fs.lstatSync(full_path);
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');
            
            let filename = util.get_name(full_path);
            
            let ext = path.parse(full_path).ext;
            ext = ext.replace(/\./g, '');
            ext = ext.toLowerCase();
            
            
            
            let is_preview_img = ext.match(/^(jpg|jpeg|png|gif)$/i);
            let is_preview_doc = ext.match(/^(html|txt|js|css|md|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
            
            
            
            if(
                is_preview_img || is_preview_doc || stats.size < 20 * 1024 * 1024
            ){
                
                if (shell.exec('md5sum --help', { silent: true }).code !== 0) {
                    
                    model.event_log.write(argv, req, 500, 'thumb', 'Error: md5sum not found');

                    res.status(500).json({ code: 500, msg: 'md5sum not found' });
                    return;
                }
                
                exec(`md5sum "${full_path}"`, function (error, stdout, stderr) {
                        
                    let arr = stdout.split(/\s+/);
                    let md5_file = arr[0];
                    
                    if (md5_file.length == 0) {
                        console.log('add:', 'error md5 for '+full_path);
                        return;
                    }
                    
                    //db.exec('begin');
                    
                    //const stmt_insrt = db.prepare(`insert into file (full_path, filename, ext, size, modified, md5) values(?, ?, ?, ?, ?, ?)`);
                    const inf = stmt_insrt.run(
                        full_path,
                        filename,
                        ext,
                        stats.size,
                        modtime_human,
                        md5_file,
                    );
                    
                    console.log('inf=', inf);
                    
                    //db.exec('commit');
                    //db.close();
                });
                
            }else{
                
                //db.exec('begin');
                
                //const stmt_insrt = db.prepare(`insert into file (full_path, filename, ext, size, modified, md5) values(?, ?, ?, ?, ?, ?)`);
                const inf = stmt_insrt.run(
                    full_path,
                    filename,
                    ext,
                    stats.size,
                    modtime_human,
                    "",
                );
                
                console.log('without md5 inf=', inf);
                
                //db.exec('commit');
                //db.close();
            }
        }
    
    }
    
    //db.exec('commit');
    
    
};



export const search_result = async (res, s)=> {
    
    if(!s || s.length==0){
        console.log('model.file.search_result:', 's is required param');
        return;
    }
    
    
    
    let argv = res.locals.argv;
    
    if (!argv || !argv.usedb) {
        
        
        model.event_log.write(res, null, 500, 'core', 'Internal Server: search not work without enabled db');
        res.status(500).send(util.error_page_content('500', 'Internal Server'));
        
        return;
    }
    
    let db = model.connect();
    
    if(!db ){
        return;
    }
    
    
    // -----------------------------------------------------------------------------------
    
    db.all(
        `
            select *
            
            from file
            
            where
                full_path like ? and
                full_path like ?
            
            order by full_path
        `,
        [ argv.fold+'%', '%'+s+'%' ],
        (err, data) => {
            
            if(err){
                console.log(err);
                return;
            }
            
            
            
            
            data.forEach((el) => {
                
                el.full_path = el.full_path.replace(argv.fold, '');
                
                
                let arr = el.full_path.split('/');
                arr.shift();
                arr.pop();
                
                el.only_fold = '/'+arr.join('/');
                
                const s_regex = new RegExp( s, "i" );
                
                el.only_fold_html = el.only_fold;
                el.only_fold_html = el.only_fold_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
                
                el.filename_html = el.filename;
                el.filename_html = el.filename_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
                
                el.SizeHuman = util.humanFileSize(el.size);
                
            });
                    
            res.render('search', {
                
                
                result_list: data,
            });
            
            
        }
    );
    
        
};





export const search_result2 = async (res, s)=> {
    
    if(!s || s.length==0){
        console.log('model.file.search_result:', 's is required param');
        return;
    }
    
    
    let db = res.locals.db;
    let argv = res.locals.argv;
    
    if(!db ){
        return;
    }
    
    // -----------------------------------------------------------------------------------
    
    const stmt = db.prepare(`
        select *
        
        from file
        
        where
            full_path like ? and
            full_path like ?
        
        order by full_path
    `);
    
    let data = [];
    
    for (const row of stmt.iterate(argv.fold+'%', '%'+s+'%')) {
        
        data.push(row)
    }
    
    
    
    
    data.forEach((el) => {
        
        el.full_path = el.full_path.replace(argv.fold, '');
        
        
        let arr = el.full_path.split('/');
        arr.shift();
        arr.pop();
        
        el.only_fold = '/'+arr.join('/');
        
        const s_regex = new RegExp( s, "i" );
        
        el.only_fold_html = el.only_fold;
        el.only_fold_html = el.only_fold_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
        
        el.filename_html = el.filename;
        el.filename_html = el.filename_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
        
        el.SizeHuman = util.humanFileSize(el.size);
        
    });
    
    
    
    //console.log('data=', data);
    
    res.render('search', {
        
        result_list: data,
    });
    
    
    
        
};



export const md5_thumb_search______0 = async ( req, res, full_filename_orig ) => {
    
    if(!full_filename_orig || full_filename_orig.length==0){
        console.log('model.file.md5_thumb_search:', 'full_filename_orig is required param');
        return;
    }
    
    
    
    let argv = res.locals.argv;
    
    if (!argv || !argv.usedb) {
        
        
        model.event_log.write(res, null, 500, 'core', 'Internal Server: search not work without enabled db');
        res.status(500).send(util.error_page_content('500', 'Internal Server'));
        
        return;
    }
    
    let db = model.connect();
    
    if(!db ){
        return;
    }
    
    
    // -----------------------------------------------------------------------------------
    
    db.get(`select * from file where full_path =?`, [ full_filename_orig ], function(err, row){
            
        if(err){
            model.event_log.write(res, req, 500, 'model/file/md5', 'Internal Server ' + err);
            //console.log('md5_thumb_search:', 'get err=', err);
            res.status(500).json({ code: 500, msg: 'Internal Server' });
            return;
        }
        
        if( row && row.md5 ){
            
            let md5_full_path = path.join(config.httpup_thumb, row.md5 )
            
            
            fs.readFile(md5_full_path, (err, data) => {
                if (err) {
                    
                    model.event_log.write(res, req, 500, 'model/file/md5', 'Internal Server ' + err);
                    //res.status(500).send(util.error_page_content('500', 'Internal Server'));
                    res.status(500).json({ code: 500, msg: 'Internal Server' });
                    return;
                }

                const mime_type = mime.getType(row.ext);

                
                model.event_log.write(res, req, 200, 'model/file/md5', 'SendData thumb DB ' + chalk.yellow(full_filename_orig));
                

                res.status(200).setHeader('content-type', mime_type).send(data);
                return;
            });
        }
        
        
        let ext = util.get_ext_norm(full_filename_orig);
        
        thumb.serve_without_db( req, res, ext )
        return;
        
        //model.event_log.write(res, req, 500, 'model/file/md5', 'md5 db thumb not found');
        //res.status(500).json({ code: 500, msg: 'md5 db thumb not found' });
        
    })
    
};


export const del = async (res, full_path) => {
    
    if(!full_path || full_path.length==0){
        console.log('model.file.del:', 'full_path is required param');
        return;
    }
    
    
    
    
    
    let argv = res.locals.argv;
    
    if (!argv || !argv.usedb) {
        
        
        //model.event_log.write(res, null, 500, 'core', 'Internal Server: search not work without enabled db');
        //res.status(500).send(util.error_page_content('500', 'Internal Server'));
        
        return;
    }
    
    let db = model.connect();
    
    if(!db ){
        return;
    }
    
    
    // -----------------------------------------------------------------------------------
    
    
    db.run(
        `delete from file where full_path=?`,
        [ full_path ],
        (err) => {
            if(err){
                console.log('model.file.del:', ' err=', err);
            }
        },
    );
    
};
