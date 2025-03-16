
'use strict';

const fs = require('fs');
const chalk = require('chalk');
const dateTime = require('node-datetime');
const process = require('process');



exports.new = (db) => {
    
    let o = {};
    
    
    o.is_dbwrite = true;
    
    o.attr = (name, val) => {
        if(typeof val == "undefined"){
            
            return o[name];
        }
        if(typeof val != "undefined"){
            
            o[name] = val;
        }
        return o;
    };
    
    o.export_to = async (filename) => {
        
        
        await db.all(
            `select * from event_log order by id`,
            [ ],
            (err, data) => {
                
                if(err){
                    console.log(err);
                    return;
                }
                
                data.forEach((el) => {
                    el.msg = el.msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                    //console.log('el.msg=', el.msg);
                });
                
                try {
                    fs.writeFileSync(filename, JSON.stringify(data));
                    
                } catch (err) {
                    console.log(err);
                }
                
                process.exit();
                return;
            }
        );
        
        
    };
    
    // write(req, '200', 'core', 'some message', 'other msg')
    // write(undefined, '', 'core', 'some message', 'other msg')
    o.write = (req, code, tag, ...msg) => {
        
        let ret = [];
    
    
        if(process.pid){
            ret.push(process.pid);
        }
        
        let dt = dateTime.create();
        let formatted = dt.format('Y-m-d H:M:S.N');
        ret.push(formatted);
        
        let client_ip = '';
        if(req){

            try {
                client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                client_ip = client_ip.toString();
                ret.push(client_ip);
            }
            catch(err) {
                //console.log('client_ip detect err=', err);
                client_ip = '';
            }

            
        }else{
            ret.push('');
        }
        
        let req_auth_user = '';
        if (req && req.auth && req.auth.user) {
            ret.push(req.auth.user);
            req_auth_user = req.auth.user;
        }else{
            ret.push('');
        }
        
        let color = 'green';
        if (code) {
            
            if(code != 200){
                color = 'red';
            }
            
            ret.push( chalk[color](code) );
            
        }else{
            code = '';
            ret.push('');
        }
        
        
        ret.push( tag );
        
        
        console.log( chalk[color]('|')+' ['+ret.join('] [')+']', ...msg );
        
        
        
        if(o.is_dbwrite){
            db.run(
                `insert into event_log (proc_id, dt, ip, login, code, tag, msg) values(?, ?, ?, ?, ?, ?, ?)`,
                [ process.pid, formatted, client_ip, req_auth_user, code, tag, msg.join(' ') ],
                (err) => {
                    if(err){
                        console.log('insert into event_log err=', err);
                    }
                },
            );
        }
        

        return '['+ret.join('] [')+'] ';
    }
    
    
    o.admin_log = (res) => {
        
        
        db.all(
            `
                select *
                from event_log
                
                order by id desc
                limit 20
            `,
            [ ],
            (err, data) => {
                
                if(err){
                    console.log(err);
                    return;
                }
                
                
                
                data.forEach((el) => {
                    el.msg = el.msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                    
                    el.is_not_200 = false;
                    if( el.code != 200 ){
                        el.is_not_200 = true;
                    }
                });
                
                
                
                
                db.all(
                    `
                        select *
                        from event_log
                        where
                            code != 200
                        order by id desc
                        limit 10
                    `,
                    [ ],
                    (err2, data2) => {
                        
                        if(err2){
                            console.log(err2);
                            return;
                        }
                        
                        
                        data2.forEach((el) => {
                            el.msg = el.msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                            
                            el.is_not_200 = true;
                        });
                        
                        res.render('admin/log', {
                            
                            last_problems: data2,
                            last_records: data,
                        });
                        
                        return;
                    }
                );
                
                
                
            }
        );
        
        
        
        
    }
    
    
    return o;
};


