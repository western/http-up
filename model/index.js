
'use strict';


const os = require('os');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();



const config = require(path.join(__dirname, '..', 'lib', 'config'));


const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');
const httpup_db = path.join(homedir, '.httpup', 'db');


if (!fs.existsSync(httpup_home)) {
    fs.mkdirSync(httpup_home);
}

if (!fs.existsSync(httpup_db)) {
    fs.mkdirSync(httpup_db);
}


const share = require(path.join(__dirname, '..', 'model', 'share.js'));
const event_log = require(path.join(__dirname, '..', 'model', 'event_log.js'));
const file_pkg = require(path.join(__dirname, '..', 'model', 'file.js'));


//console.log(path.join(httpup_db, 'registry.db.'+config.version));
const db = new sqlite3.Database(path.join(httpup_db, 'registry.db.'+config.version), (err) => {
    if (err) {
        console.error(err.message);
    }
});

/*
db.on('trace', (el) => {
    console.log('trace=', el);
});
db.on('profile', (el) => {
    console.log('profile=', el);
});
*/

exports.init_db = () => {
    
    //console.log('db', 'run model/index.init_db');
    
    
    db.run(`
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
    
    
    db.run(`
        CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY ,
            md5 text not null default '',
            
            full_path text not null default '',
            filename text not null default '',
            ext text not null default '',
            
            is_folder int not null default 0,
            size int not null default 0,
            modified text not null default ''
        )
    `, () => {
        
        db.run(`
            CREATE INDEX IF NOT EXISTS indx_file_full_path on file(full_path)
        `);
        
        db.run(`
            CREATE INDEX IF NOT EXISTS indx_file_md5 on file(md5)
        `);
        
        
    });
    
    
    db.run(`
        CREATE TABLE IF NOT EXISTS share (
            id INTEGER PRIMARY KEY ,
            
            code text not null default '',
            status int not null default 0,
            registered text not null default '',
            
            md5 text not null default ''
            
            
        )
    `, () => {
        
        db.run(`
            CREATE unique INDEX IF NOT EXISTS indx_share_code on share(code)
        `);
        
        db.run(`
            CREATE INDEX IF NOT EXISTS indx_share_md5 on share(md5)
        `);
        
    });
    
    
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
            
            //console.log('file not found, remove: ', row.full_path);
            
            db.run(
                `delete from file where id=?`,
                [ row.id ],
                (err) => {
                    if(err){
                        console.log('delete from file err: ', err);
                    }
                },
            );
            
            db.run(`
                delete from share where md5 not in (select md5 from file)
            `, () => {
                
            });
    
        }
    });
    
    // --------------------------------------------------------------------------------------------------------------------
    
    
    db.run(`
        delete from share where md5 not in (select md5 from file)
    `, () => {
        
    });
    
    
    
    
    
}



exports.share = () => {
    return share.new(db);
}

exports.event_log = () => {
    return event_log.new(db);
}

exports.file = () => {
    return file_pkg.new(db);
}


