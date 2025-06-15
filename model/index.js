

import fs from 'fs';
import path from 'path';


import sqlite3 from 'sqlite3';
sqlite3.verbose();

//import Database from 'better-sqlite3';

// -------------------------------------------------------------------------------------------------------------------------------

import * as event_log from '../model/event_log.js';
export { event_log };


import * as file from '../model/file.js';
export { file };


import config from '../lib/config.js';


// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

export const connect = (argv) => {
    
    if (!fs.existsSync(config.httpup_home)) {
        fs.mkdirSync(config.httpup_home);
    }

    if (!fs.existsSync(config.httpup_db)) {
        fs.mkdirSync(config.httpup_db);
    }
    
    /*
    if (!argv || !argv.usedb) {
        return null;
    }*/
    
    //console.log('model.connect() call')
    
    // -------------------------------------------------------------------------------------------------------
    
    let path_to_db = path.join(config.httpup_db, 'registry.db.'+config.version);
    
    
    const db = new sqlite3.Database(path_to_db, (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    
    //const db = new Database(path_to_db, { verbose: console.log });
    //db.pragma('journal_mode = WAL');
    
    return db;
}



export const init_db = (argv) => {
    
    
    let db = connect(argv);
    
    
    
    
    if(!db ){
        return;
    }
    
    
    db.exec(`
        CREATE TABLE IF NOT EXISTS event_log (
            id INTEGER PRIMARY KEY ,
            
            proc_id int not null default 0,
            dt text not null default '',
            
            ip text not null default '',
            login text not null default '',
            
            code text not null default '',
            
            tag text not null default '',
            msg text not null default ''
        )
    `);
    
    
    db.exec(`
        CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY ,
            md5 text not null default '',
            
            full_path text not null default '',
            filename text not null default '',
            ext text not null default '',
            
            
            size int not null default 0,
            modified text not null default ''
        );
        
        CREATE INDEX IF NOT EXISTS indx_file_full_path on file(full_path);
        
        CREATE INDEX IF NOT EXISTS indx_file_md5 on file(md5);
        
    `);
    
    
    
    
    // --------------------------------------------------------------------------------------------------------------------
    
    /*
    const stmt = db.prepare('select * from file');

    for (const row of stmt.iterate()) {
        
        if( row && row.full_path && !fs.existsSync(row.full_path) ){
            
            const del_stmt = db.prepare(`delete from file where id=?`);
            const info = del_stmt.run(row.id);
        }
    }
    */
    
    // --------------------------------------------------------------------------------------------------------------------
    
    db.each(`
        select * from file
    `,
    (err, row) => {
        if(err){
            //console.log('select from file err: ', err);
            return;
        }
        
        //console.log('row=', row);
        
        if( row && row.full_path && !fs.existsSync(row.full_path) ){
            
            //console.log('file not found, remove: ', row.full_path, row);
            
            db.run(
                `delete from file where id=?`,
                [ row.id ],
                (err) => {
                    if(err){
                        console.log('delete from file err: ', err);
                    }
                },
            );
            
            
    
        }
    });
    
    
    
}

