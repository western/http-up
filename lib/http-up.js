'use strict';

const os = require('os');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
//const basicAuth = require('express-basic-auth');
const basicAuth2 = require('./express-basic-auth2');
const chalk = require('chalk');
const urlencode = require('urlencode');
const path = require('path');
const shell = require('shelljs');

const { engine } = require('express-handlebars');

const core = require('./http-up-core');
const api = require('./http-up-api');
const thumb = require('./http-up-thumb');
const edit = require('./http-up-edit');
const search = require('./http-up-search');

const admin = require('./admin/index');


const util = require('./util');
//const db = require('./http-up-db');
const model = require(path.join(__dirname, '..', 'model', 'index'));

exports.makeServer = (argv) => {
    
    const app = express();

    app.disable('x-powered-by');

    
    app.engine('.hbs', engine({extname: '.hbs'}));
    app.set('view engine', '.hbs');
    
    app.set('views', path.join(__dirname, '..', 'views'));
    app.enable('view cache'); // enable cache template

    app.use(compression());
    
    
    model.init_db()
    
    
    console.log('');
    if(argv.port){
        //model.event_log().write( undefined, '200', 'conf', 'Config port: '+argv.port );
        console.log('Config port: '+argv.port);
    }
    if(argv.tls){
        //model.event_log().write( undefined, '200', 'conf', 'Config tls: enabled' );
        console.log('Config tls: enabled');
    }
    if(argv['extend-mode']) {
        //model.event_log().write( undefined, '200', 'conf', 'Config extend-mode: enabled' );
        console.log('Config extend-mode: enabled');
    }
    if (argv.user && argv.password) {
        //model.event_log().write( undefined, '200', 'conf', 'Config basic auth with user and password: enabled' );
        console.log('Config basic auth with user and password: enabled');
    }
    if (argv.basic) {
        //model.event_log().write( undefined, '200', 'conf', 'Config basic auth with random accounts: enabled' );
        console.log('Config basic auth with random accounts: enabled');
    }
    if (argv['upload-disable']) {
        //model.event_log().write( undefined, '200', 'conf', 'Config upload-disable: enabled' );
        console.log('Config upload-disable: enabled');
    }
    if (argv['folder-make-disable']) {
        //model.event_log().write( undefined, '200', 'conf', 'Config folder-make-disable: enabled' );
        console.log('Config folder-make-disable: enabled');
    }
    if (argv.crypt) {
        //model.event_log().write( undefined, '200', 'conf', 'Config encrypt files: enabled' );
        console.log('Config encrypt files: enabled');
    }
    if (argv.admin) {
        //model.event_log().write( undefined, '200', 'conf', 'Config admin interface: enabled' );
        console.log('Config admin interface: enabled');
    }
    
    
    console.log('');
    
    
    //let db_ = db.get_db();
    //db_.init();
    
    /*
    app.use(function(req, res, next){
        //res.locals.db = db.get_db();
        //res.locals.db.init();
        
        next();
    });*/
    

    let homedir = os.homedir();
    let httpup_home = path.join(homedir, '.httpup');
    let httpup_thumb = path.join(homedir, '.httpup', 'thumb');
    let httpup_temp = path.join(homedir, '.httpup', 'temp');

    if (argv.user && argv.password) {
        console.log('Set basic authorization:');

        console.log('        ', argv.user, '       ', argv.password);
        console.log('');

        app.use(
            basicAuth2({
                users: { [argv.user]: argv.password },
                challenge: true,
                unauthorizedResponse: (req) => {
                    if (!req.auth) {
                        let req_path = urlencode.decode(req.path);
                        req_path = util.http_path_clear(req_path);

                        //let clp = util.common_log_prefix(req);
                        //console.log(clp, '401 Unauthorized', chalk.yellow(req_path));
                        model.event_log().write( req, 401, 401, '401 Unauthorized '+chalk.yellow(req_path) );

                        return util.error_page_content('401', '401 Unauthorized, auth required, wrong credentials');
                    }
                },
                disablePrefixUrls: ['/s/', '/__assets/'],
            }),
        );
    }

    if (argv.basic) {
        console.log('Set basic authorization:');

        let userz = {};

        let cnt = 0;
        while (cnt < 10) {
            let login = 'login' + util.random_string(2);
            let passw = util.random_string(16);

            userz[login] = passw;
            console.log('        ', login, '       ', passw);

            cnt += 1;
        }
        console.log('');

        app.use(
            basicAuth2({
                users: userz,
                challenge: true,
                unauthorizedResponse: (req) => {
                    
                    if (!req.auth) {
                        let req_path = urlencode.decode(req.path);
                        req_path = util.http_path_clear(req_path);

                        //let clp = util.common_log_prefix(req);
                        //console.log(clp, '401 Unauthorized', chalk.yellow(req_path));
                        model.event_log().write( req, 401, 401, '401 Unauthorized '+chalk.yellow(req_path) );

                        return util.error_page_content('401', '401 Unauthorized, auth required, wrong credentials');
                    }
                },
                disablePrefixUrls: ['/s/', '/__assets/'],
            }),
        );
    }

    // prepare config for CORS
    argv.origins = [];
    let ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach((k) => {
        ifaces[k].forEach((el) => {
            if (argv.tls && el.family && el.family == 'IPv4') {
                argv.origins.push('https://' + el.address + ':' + argv.port);
            }
            if (!argv.tls && el.family && el.family == 'IPv4') {
                argv.origins.push('http://' + el.address + ':' + argv.port);
            }
        });
    });

    if (!argv['upload-disable']) {
        api.api_upload(app, argv);
    }

    if (!argv['folder-make-disable']) {
        api.api_folder(app, argv);
        api.api_file(app, argv);
    }

    if (argv['extend-mode']) {
        api.api_delete(app, argv);
        api.api_move(app, argv);
        api.api_copy(app, argv);
        api.api_zip(app, argv);
        api.api_rename(app, argv);
        api.api_share(app, argv);

        thumb.api_thumb(app, argv);
        edit.api_edit(app, argv);
        
        if( argv.admin ){
            admin.setup(app, argv);
        }
        
        search.search_result(app, argv);
    }

    core.api_core(app, argv);

    if (argv.tls) {
        let https;
        try {
            https = require('node:https');
        } catch (err) {
            console.error('https support is disabled!');
        }
        
        let is_silent = true;
        if( argv['tls-debug'] ){
            is_silent = false;
        }
        
        
        let lib_folder = httpup_home;

        if (shell.exec('easyrsa --help', { silent: true }).code !== 0) {
            console.log('Error: easyrsa not found');
            shell.exit(1);
            process.exit();
        }

        if (!fs.existsSync(path.join(lib_folder, '/easyrsa/pki/issued/server1.crt'))) {
            
            console.log(chalk.yellow('Generate new TLS keys'));
            console.log('');
            
            if( argv['tls-debug'] ){
                console.log('—'.repeat(process.stdout.columns));
                console.log('');
                
                //console.log('lib_folder=', lib_folder);
            }

            if (!fs.existsSync(lib_folder + '/easyrsa')) {
                fs.mkdirSync(lib_folder + '/easyrsa');
            }

            shell.cd(lib_folder + '/easyrsa');

            if( argv['tls-debug'] ){
                console.log('—'.repeat(process.stdout.columns));
                console.log('');
            }

            if (shell.exec('easyrsa init-pki', { silent: is_silent }).code !== 0) {
                console.log('Error: easyrsa init-pki');
                shell.exit(1);
                process.exit();
            }

            let vars_data = `
set_var EASYRSA_DN "cn_only"
set_var EASYRSA_KEY_SIZE 2048
set_var EASYRSA_REQ_CN   "ca@desec.example.com"
set_var EASYRSA_BATCH    "yes"
set_var EASYRSA_CA_EXPIRE 3650
set_var EASYRSA_CERT_EXPIRE 3650
        `;
            fs.writeFileSync(path.join(lib_folder, '/easyrsa/pki/vars'), vars_data);

            if( argv['tls-debug'] ){
                console.log('—'.repeat(process.stdout.columns));
                console.log('');
            }

            if (shell.exec('easyrsa build-ca nopass', { silent: is_silent }).code !== 0) {
                console.log('Error: easyrsa build-ca nopass');
                shell.exit(1);
                process.exit();
            }

            if( argv['tls-debug'] ){
                console.log('—'.repeat(process.stdout.columns));
                console.log('');
            }

            if (shell.exec('easyrsa --req-cn=ChangeMe build-client-full server1 nopass', { silent: is_silent }).code !== 0) {
                console.log('Error: easyrsa --req-cn=ChangeMe build-client-full server1 nopas');
                shell.exit(1);
                process.exit();
            }
            
            if( argv['tls-debug'] ){
                console.log('—'.repeat(process.stdout.columns));
                console.log('');
            }
        }

        console.log('crt:', path.join(lib_folder, '/easyrsa/pki/issued/server1.crt'));
        console.log('key:', path.join(lib_folder, '/easyrsa/pki/private/server1.key'));
        console.log('');

        const serverOptions = {
            cert: fs.readFileSync(path.join(lib_folder, '/easyrsa/pki/issued/server1.crt')),
            key: fs.readFileSync(path.join(lib_folder, '/easyrsa/pki/private/server1.key')),

            maxVersion: 'TLSv1.3',
            minVersion: 'TLSv1.2',
        };

        const server = https.Server(serverOptions, app);

        server.listen(argv.port, '0.0.0.0', () => {
            console.log('Server TLS start:', chalk.green(argv.port));

            let ifaces = os.networkInterfaces();

            Object.keys(ifaces).forEach((k) => {
                ifaces[k].forEach((el) => {
                    if (el.family && el.family == 'IPv4') {
                        console.log('   https://' + el.address + chalk.green(':' + argv.port));
                    }
                });
            });
            console.log('');
            console.log('Folder serve:', chalk.yellow(argv.fold));
            console.log('['+chalk.yellow('Control + C')+'] for server stop');
            console.log('');
        });
    } else {
        app.listen(argv.port, '0.0.0.0', () => {
            console.log('Server start:', argv.port);

            let ifaces = os.networkInterfaces();

            Object.keys(ifaces).forEach((k) => {
                ifaces[k].forEach((el) => {
                    if (el.family && el.family == 'IPv4') {
                        console.log('   http://' + el.address + chalk.green(':' + argv.port));
                    }
                });
            });
            console.log('');
            console.log('Folder serve:', chalk.yellow(argv.fold));
            console.log('['+chalk.yellow('Control + C')+'] for server stop');
            console.log('');
        });
    }
};
