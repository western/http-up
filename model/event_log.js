
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
            //console.log('case1');
            return o[name];
        }
        if(typeof val != "undefined"){
            //console.log('case2');
            o[name] = val;
            //return val;
        }
        //console.log('case3');
        return o;
    };
    
    o.download_to = async (filename) => {
        
        
        await db.all(
            `select * from event_log order by id`,
            [ ],
            (err, data) => {
                
                if(err){
                    console.log(err);
                    return;
                }
                
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
    
    o.write = (req, code, tag, ...msg) => {
        
        let ret = [];
    
    
        if(process.pid){
            ret.push(process.pid);
        }
        
        let dt = dateTime.create();
        let formatted = dt.format('Y-m-d H:M:S.N');
        ret.push(formatted);
        
        
        let client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        client_ip = client_ip.toString();
        ret.push(client_ip);
        
        let req_auth_user = '';
        if (req.auth && req.auth.user) {
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
            ret.push('');
        }
        
        
        
        console.log( chalk[color]('|')+' ['+ret.join('] [')+'] ', ...msg );
        
        
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
    
    
    return o;
};


