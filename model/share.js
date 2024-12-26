
'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const exec = require('child_process').exec;
const dateTime = require('node-datetime');
const mime = require('mime');


const util = require(path.join(__dirname, '..', 'lib', 'util'));
const model = require(path.join(__dirname, '..', 'model', 'index'));


exports.new = (db) => {
    
    
    let o = {};
    
    
    
    o.all_share_files = async(res, argv) => {
        
        
        db.all(
            `
                select f.*
                from file f
                inner join share s
                    on s.md5=f.md5
                where
                    s.status=1
                    
                order by s.id
            `,
            [ ],
            (err, data) => {
                
                if(err){
                    console.log(err);
                    return;
                }
                
                
                
                
                let rows = [];
                
                data.forEach((el, indx) => {
                    
                    
                    let full_path = el.full_path;
                    
                    
                    
                    full_path = full_path.replace(argv.fold, '');
                    
                    
                    
                    
                    rows.push({
                        FullPath: full_path,
                        Name: el.filename,
                        
                        SizeHuman: util.humanFileSize(el.size),
                        ModTimeHuman: el.modified,
                        
                        Rnds: util.random_ansi_string(2),
                    });
                })
                
                
                res.render('admin/share', {
                    rows: rows,
                });
                
                return;
            }
        );
        
        
        
    };
    
    
    o.disable_share = async(res, req, code) => {
        
        
        
        db.run(
            `update share set status=0 where code=?`,
            [ code ],
            (err) => {
                if(err){
                    model.event_log().write( req, 500, 'share', 'disable_share', 'update share set status=0, err=', err );
                    
                    res.status(500).json({ code: 500 });
                    return;
                }
                
                model.event_log().write( req, 200, 'share', `disable share for code "${code}"` );
                
                res.status(200).json({ code: 200 });
                return;
            },
        );
        
        
    };
    
    
    o.get_file_bycode = async(res, req, code, phase) => {
        
        
        db.get(`
            
            select f.*
            from share s
            inner join file f
                on f.md5=s.md5
            where
                s.code=? and
                s.status=1
                
        `, [ code ], async (err, row) => {
            
            if(err){
                model.event_log().write( req, 500, 'share', 'share.get_file_bycode err=', err );
                
                res.status(500).json({ code: 500 });
                return;
            }
            
            if(row && phase && phase == 'phase1'){
                
                if (!fs.existsSync(row.full_path)) {
                    
                    model.event_log().write( req, 404, 'share', `${phase} file "${row.full_path}" for code "${code}" not found` );
                    
                    res.status(404).send(util.error_page_content('404', `File for code "${code}" not found`));
                    return;
                }
                
                
                res.render('share', {
                    code: req.params['code'],
                });
                return;
            }
            
            if(row && phase && phase == 'phase2'){
                
                
                if (!fs.existsSync(row.full_path)) {
                    
                    model.event_log().write( req, 404, 'share', `${phase} file "${row.full_path}" for code "${code}" not found` );
                    
                    res.status(404).send(util.error_page_content('404', `File for code "${code}" not found`));
                    return;
                }
                
                
                
                model.event_log().write( req, 200, 'share', `sendFile by code "${code}" "${row.full_path}"` );
                
                let name = util.get_name(row.full_path);
                let ext = util.get_ext_norm(row.full_path);

                res.attachment(name + '.' + ext);

                res.setHeader('Content-Type', mime.getType(ext));
                res.sendFile(row.full_path);
                return;
            }
            
            model.event_log().write( req, 404, 'share', `file for code "${code}" not found` );
            
            
            res.status(404).send(util.error_page_content('404', `File for code "${code}" not found`));
            return;
        });
        
        
    };
    
    o.set_public_code = async (res, req, argv, full_path) => {
        
        
        if(!full_path || full_path.length==0){
            console.log('set_public_code', 'full_path is required param');
            return;
        }
        
        
        
        db.get(`
            
            select s.*
            from share s
            inner join file f
                on f.md5=s.md5
            where
                f.full_path=? and
                s.status=1
                
        `, [ full_path ], async (err, row) => {
            
            if(err){
                
                model.event_log().write( req, 500, 'share', 'share.search_path err=', err );
                
                res.status(500).json({ code: 500 });
                return;
            }
            
            
            
            if(row){
                
                model.event_log().write( req, 200, 'share', 'set_public_code', `return code1 "${row.code}"` );
                
                
                
                let href = [];
                argv.origins.forEach((el) => {
                    
                    if(!el.includes('127.0.0.1') ){
                        href.push( el+'/s/'+row.code )
                    }
                });
                
                
                db.all(
                    `select dt, ip from event_log where tag='sendFile' and msg like '%"${row.code}"%' order by id`,
                    [  ],
                    (err, all_stat_users) => {
                        
                        let html = [];
                        all_stat_users.forEach((el) => {
                            html.push( el.dt + ' - ' + el.ip )
                        });
                        
                        
                        res.status(200).json({
                            code: 200,
                            c: row.code,
                            href: href.join('<br/>'),
                            share_exist: 1,
                            share_downloads: all_stat_users.length,
                            share_viewers: html.join('<br/>'),
                        });
                        return;
                    }
                );
                
                
                /*
                db.get(
                    `select count(*) c from event_log where tag='sendFile' and msg like '%"${row.code}"%' `,
                    [ ],
                    (err, row_stat) => {
                        
                        if(err){
                            
                            model.event_log().write( req, 500, 'share', 'set_public_code', 'select from file err=', err );
                            
                            res.status(500).json({ code: 500 });
                            return;
                        }
                        
                        
                        db.all(
                            `select dt, ip from event_log where tag='sendFile' and msg like '%"${row.code}"%' order by id`,
                            [  ],
                            (err, all_stat_users) => {
                                
                                let html = [];
                                all_stat_users.forEach((el) => {
                                    html.push( el.dt + ' ' + el.ip )
                                });
                                
                                
                                res.status(200).json({
                                    code: 200,
                                    c: row.code,
                                    href: href.join('<br/>'),
                                    share_exist: 1,
                                    share_views: row_stat.c,
                                    share_viewers: html.join('<br/>'),
                                });
                                return;
                            }
                        );
                        
                        
                    }
                );
                */
                
                
                
                
            }else{
                
                
                
                db.get(
                    `select * from file where full_path=?`,
                    [ full_path ],
                    (err, row_file) => {
                        
                        if(err){
                            
                            model.event_log().write( req, 500, 'share', 'set_public_code', 'select from file err=', err );
                            
                            res.status(500).json({ code: 500 });
                            return;
                        }
                        
                        
                        
                        if( row_file ){
                    
                            
                            
                            
                            
                            let code = util.random_ansi_string( 5 );
                        
                            let registered = dateTime.create();
                            let registered_iso = registered.format('Y-m-d H:M:S');
                            
                            db.run(
                                `insert into share (code, status, registered, md5) values(?, ?, ?, ?)`,
                                [ code, 1, registered_iso, row_file.md5 ],
                                (err) => {
                                    if(err){
                                        model.event_log().write( req, 500, 'share', 'set_public_code', 'insert into share err=', err );
                                    }
                                },
                            );
                            
                            
                            
                            let href = [];
                            argv.origins.forEach((el) => {
                                
                                if(!el.includes('127.0.0.1') ){
                                    href.push( el+'/s/'+code )
                                }
                            });
                            
                            
                            model.event_log().write( req, 200, 'share', `return code2 "${code}" for "${full_path}"` );
                            
                            
                            
                            res.status(200).json({ code: 200, c: code, href: href.join('<br/>') });
                            return;
                        }
                        
                        
                        if( !row_file ){
                            
                            
                            
                            
                            
                            let name = util.get_name(full_path);
                            let ext = util.get_ext_norm(full_path);
                            
                            let md5_hash = util.md5sumSync( full_path );
                            
                            let stats = fs.lstatSync(full_path);
                            
                            let modtime = dateTime.create(stats.mtime);
                            let modtime_human = modtime.format('Y-m-d H:M:S');
                            
                            
                            model.file().add(full_path, name+'.'+ext, ext, 0, stats.size, modtime_human, md5_hash);
                            
                            
                            
                            let code = util.random_ansi_string( 5 );
                        
                            let registered = dateTime.create();
                            let registered_iso = registered.format('Y-m-d H:M:S');
                            
                            db.run(
                                `insert into share (code, status, registered, md5) values(?, ?, ?, ?)`,
                                [ code, 1, registered_iso, md5_hash ],
                                (err) => {
                                    if(err){
                                        model.event_log().write( req, 500, 'share', 'set_public_code', 'insert into share err=', err );
                                    }
                                },
                            );
                            
                            let href = [];
                            argv.origins.forEach((el) => {
                                
                                if(!el.includes('127.0.0.1') ){
                                    href.push( el+'/s/'+code )
                                }
                            });
                            
                            model.event_log().write( req, 200, 'share', `return code3 "${code}" for "${full_path}"` );
                            
                            res.status(200).json({ code: 200, c: code, href: href.join('<br/>') });
                            return;
                        }
                        
                        
                        
                        
                    },
                );
                
                
                
                
                
                
                
                
                
            }
        })
        
        
    };
    
    return o;
};



