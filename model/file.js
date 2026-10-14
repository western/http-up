


import fsSync from 'node:fs';
import fs from 'node:fs/promises';
//import fs from 'fs';
import path from 'node:path';
//import chalk from 'chalk';
import * as dateTime from 'node-datetime';
//import shell from 'shelljs';
//import { exec } from 'child_process';
//import mime from 'mime';



//import config from '../lib/config.js';
import * as util from '../lib/util.js';
import * as model from '../model/index.js';





export const search_result = async (app, res, req, s)=> {
    
    if(!s || s.length==0){
        console.log('model.file.search_result:', 's is required param');
        return;
    }
    
    
    
    let argv = res.locals.argv;
    
    
    // -----------------------------------------------------------------------------------
    
    
    
    
    
    
    
    
    // -----------------------------------------------------------------------------------
    
    /*
    if (!argv || !argv.usedb) {
        
        
        model.event_log.write(res, null, 500, 'core', 'Internal Server: search not work without enabled db');
        res.status(500).send(util.error_page_content('500', 'Internal Server'));
        
        return;
    }
    
    let db = model.connect();
    
    if(!db ){
        return;
    }
    */
    
    // -----------------------------------------------------------------------------------
    
    
    let result_arr = [];
    
    let search_f = async ( fold_str ) => {
        
        //console.log("search_f", fold_str);
        
        fs.readdir( fold_str ).then((inodes) => {
            
            for (const dirent of inodes){
                
                const readTarget = path.join(fold_str, dirent);
                
                
                
                fs.stat( readTarget ).then((statz) => {
                    
                    
                    //console.log('readTarget=', readTarget, tt.isDirectory(), tt.isFile(),  );
                    
                    
                    if (  readTarget.replace(argv.fold, '').includes(s)  ) {
                        
                        /*
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
                        */
                        
                        
                        let arr = readTarget.replace(argv.fold, '').split('/');
                        arr.shift();
                        arr.pop();
                        
                        let only_fold = '/'+arr.join('/');
                        
                        
                        //let mTime = statz.mtime;
                        let modtime = dateTime.create(statz.mtime);
                        let mTimeHuman = modtime.format('Y-m-d H:M:S');
                        
                        
                        
                        result_arr.push({
                            full_path: readTarget.replace(argv.fold, ''),
                            only_fold: only_fold,
                            only_fold_html: only_fold,
                            filename_html: dirent,
                            
                            SizeHuman: util.humanFileSize(statz.size),
                            modified: mTimeHuman,
                            ext: path.parse(readTarget).ext,
                        });
                    }
                    
                    
                    if ( statz.isDirectory()  ){
                        search_f( readTarget )
                    }
                })
                
                
            }
            
        }).catch((err) => {  })
        
        
        
    };
    
    
    
    search_f(argv.fold).then(() => {
        
        
        model.event_log.write(res, req, 200, 'search', `End search for "${s}"`);
        
        
        app.disable('view cache');
        app.set('view cache', false);
        
        
        res.render('search', {
            
            result_list: result_arr,
        });
    });
    
    
    
    
    
    
    
    // -----------------------------------------------------------------------------------
    
    /*
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
    */
    
    // -----------------------------------------------------------------------------------
    
        
};


