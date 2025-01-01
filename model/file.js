
'use strict';

const fs = require('fs');
const path = require('path');
const dateTime = require('node-datetime');
const exec = require('child_process').exec;

const util = require(path.join(__dirname, '..', 'lib', 'util'));


exports.new = (db) => {
    
    let o = {};
    
    
    o.add = async (full_path, filename, ext, is_folder, size, modified, md5) => {
        
        if(!full_path || full_path.length==0){
            console.log('full_path is required param');
            return;
        }
        
        db.get(`select * from file where full_path=?`, [ full_path ], function(err, row){
            
            if(err){
                console.log('file_add search err=', err);
                return;
            }
            
            if( row ){
                
                //console.log('update file', full_path);
                
                //db.run(`update file set filename=?, ext=?, is_folder=?, size=?, modified=?, md5=? where full_path=?`, [ filename, ext, is_folder, size, modified, md5, full_path ]);
                
            }else{
                //console.log('insert file', full_path);
                //console.log(`insert into file (full_path, filename, ext, is_folder, size, modified, md5) values('${full_path}', '${filename}', '${ext}', '${is_folder}', '${size}', '${modified}', '${md5}')`);
                
                // you can not delete
                // files can lying in several places
                /*
                db.run(`delete from file where md5=?`, [ md5 ], (err) => {
                    if(err){
                        console.log('delete from file err=', err);
                    }
                });
                */
                
                db.run(
                    `insert into file (full_path, filename, ext, is_folder, size, modified, md5) values(?, ?, ?, ?, ?, ?, ?)`,
                    [ full_path, filename, ext, is_folder, size, modified, md5 ],
                    (err) => {
                        if(err){
                            console.log('insert into file err=', err);
                        }
                    },
                );
            }
        })
        
        
    };
    
    
    
    o.add2 = async (full_path) => {
        
        if(!full_path || full_path.length==0){
            console.log('add2:', 'full_path is required param');
            return;
        }
        
        
        
        
        db.get(`select * from file where full_path=?`, [ full_path ], function(err, row){
            
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
                                console.log('add:', 'insert into file err=', err);
                            }
                        },
                    );
                });
                
            }
        })
        
        
        
        
        
    };
    
    
    o.search = async (full_path, resolve, reject) => {
        
        if(!full_path || full_path.length==0){
            console.log('full_path is required param');
            return;
        }
        
        
        
        db.get(`select * from file where full_path=?`, [ full_path ], function(err, row){
            
            if(err){
                console.log('file.search err=', err);
                reject();
                return;
            }
            
            
            
            if(row){
                resolve(row);
            }else{
                reject();
            }
        })
        
    };
    
    o.search_result = async ( argv, res, s ) => {
        
        if(!s || s.length==0){
            console.log('s is required param');
            return;
        }
        
        
        
        db.all(
            `
                select *
                
                from file
                
                where full_path like ?
                
                order by full_path
            `,
            [ '%'+s+'%' ],
            (err, data) => {
                
                if(err){
                    console.log(err);
                    return;
                }
                
                let readFolder = argv.fold;
                
                
                data.forEach((el) => {
                    
                    el.full_path = el.full_path.replace(readFolder, '');
                    
                    
                    let arr = el.full_path.split('/');
                    arr.shift();
                    arr.pop();
                    
                    el.only_fold = '/'+arr.join('/');
                    
                    el.only_fold_html = el.only_fold;
                    el.only_fold_html = el.only_fold_html.replace(s, '<span style="background-color:yellow;">'+s+'</span>');
                    
                    el.filename_html = el.filename;
                    el.filename_html = el.filename_html.replace(s, '<span style="background-color:yellow;">'+s+'</span>');
                    
                    el.SizeHuman = util.humanFileSize(el.size);
                    
                });
                        
                res.render('search', {
                    
                    
                    result_list: data,
                });
                
                
            }
        );
        
    };
    
    o.del = async (full_path) => {
        
        if(!full_path || full_path.length==0){
            console.log('full_path is required param');
            return;
        }
        
        
        
        db.run(
            `delete from file where full_path=?`,
            [ full_path ],
            (err) => {
                if(err){
                    console.log('add:', 'delete from file where full_path, err=', err);
                }
            },
        );
        
    };
    
    return o;
};


