

import chalk from 'chalk';
import * as dateTime from 'node-datetime';


import * as util from '../lib/util.js';
import * as model from '../model/index.js';


const message_builder = ( res, req, code, tag, ...msg) => {
    
    let argv;
    if(res){
        argv = res.locals.argv;
    }
    
    // ---------------------------------------------------------------------------------------------
    
    let ret = [];
    
    
    if(process.pid){
        ret.push(process.pid);
    }
    
    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S.N');
    ret.push(formatted);
    
    // client_ip -----------------------------------------------------------------------------------
    let client_ip = '0.0.0.0';
    if(req){

        try {
            client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            
            client_ip += '';
            ret.push(client_ip);
        }
        catch(err) {
            
            client_ip = '0.0.0.0';
        }

        
    }else{
        ret.push('');
    }
    
    // req_auth_user -------------------------------------------------------------------------------
    let req_auth_user = '';
    if (req && req.auth && req.auth.user) {
        ret.push(req.auth.user);
        req_auth_user = req.auth.user;
    }else{
        ret.push('');
    }
    
    // code ----------------------------------------------------------------------------------------
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
    
    if( argv && !argv['silence'] ){
        console.log( chalk[color]('|')+' ['+ret.join('] [')+']', ...msg );
    }
    
    return [process, formatted, client_ip, req_auth_user]
}


export const write = ( res, req, code, tag, ...msg ) => {
    
    let argv;
    if(res){
        argv = res.locals.argv;
    }
    
    // ---------------------------------------------------------------------------------------------
    
    
    const [process, formatted, client_ip, req_auth_user] = message_builder( res, req, code, tag, ...msg )
    
    
    // database ------------------------------------------------------------------------------------
    if( argv && argv['usedb'] ){
        
        let db = model.connect();
        
        
        if( db ){
            
            msg = msg.map(function(m) {
                return util.string_color_clear(m)
            });
            
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
    }
    

    //return '['+ret.join('] [')+'] ';
};



export const print = ( res, req, code, tag, ...msg) => {
    
    
    message_builder( res, req, code, tag, ...msg )
    

    //return '['+ret.join('] [')+'] ';
};




