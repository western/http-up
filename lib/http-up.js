'use strict';

const os = require('os');
const fs = require('fs');
const express = require('express');
const basicAuth = require('express-basic-auth');
const colors = require('colors');
const path = require('path');
const shell = require('shelljs');

const api = require('./http-up-api.js');
const core = require('./http-up-core.js');





exports.makeServer = function (argv) {

    const app = express();

    app.disable('x-powered-by');

    if (argv.user && argv.password) {
        app.use(
            basicAuth({
                users: { [argv.user]: argv.password },
                challenge: true,
                realm: 'egjiXnPrSia',
            }),
        );
    }



    if (!argv.hasOwnProperty('upload-disable')) {
        api.api_upload(app, argv);
    }

    if (!argv.hasOwnProperty('folder-make-disable')) {
        api.api_folder(app, argv);
    }

    core.api_core(app, argv);



    if( argv.tls ){

        let https;
        try {
            https = require('node:https');
        } catch (err) {
            console.error('https support is disabled!');
        }


        let lib_folder = __dirname;


        if (shell.exec('easyrsa --help', {silent:true}).code !== 0) {
            console.log('Error: easyrsa not found');
            shell.exit(1);
            process.exit();
        }


        if (  !fs.existsSync( path.join(lib_folder, '/easyrsa/pki/issued/server1.crt' ) )     ){

            console.log('lib_folder=', lib_folder);

            if ( !fs.existsSync(lib_folder+'/easyrsa') ){
                fs.mkdirSync(lib_folder+'/easyrsa');
            }

            shell.cd(lib_folder+'/easyrsa');

            if (shell.exec('easyrsa init-pki').code !== 0) {
                console.log('Error: easyrsa init-pki');
                shell.exit(1);
                process.exit();
            }

            let vars_data = `
set_var EASYRSA_DN "cn_only"
set_var EASYRSA_KEY_SIZE 2048
set_var EASYRSA_REQ_CN   "ca@desec.example.com"
set_var EASYRSA_BATCH    "yes"
        `;
            fs.writeFileSync(lib_folder+'/easyrsa/pki/vars', vars_data);


            if (shell.exec('easyrsa build-ca nopass').code !== 0) {
                console.log('Error: easyrsa build-ca nopass');
                shell.exit(1);
                process.exit();
            }

            if (shell.exec('easyrsa --req-cn=ChangeMe build-client-full server1 nopass').code !== 0) {
                console.log('Error: easyrsa --req-cn=ChangeMe build-client-full server1 nopas');
                shell.exit(1);
                process.exit();
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

        server.listen(argv.port, () => {



            console.log('Server TLS start:', argv.port);

            let ifaces = os.networkInterfaces();

            Object.keys(ifaces).forEach((k) => {
                ifaces[k].forEach((el) => {
                    if (el.family && el.family == 'IPv4') {
                        console.log('   https://' + el.address + colors.green(':' + argv.port));
                    }
                });
            });
            console.log('');
            console.log('folder serve:', colors.yellow(argv.fold));
            console.log('');
        });



    }else{

        app.listen(argv.port, () => {


            console.log('Server start:', argv.port);

            let ifaces = os.networkInterfaces();

            Object.keys(ifaces).forEach((k) => {
                ifaces[k].forEach((el) => {
                    if (el.family && el.family == 'IPv4') {
                        console.log('   http://' + el.address + colors.green(':' + argv.port));
                    }
                });
            });
            console.log('');
            console.log('folder serve:', colors.yellow(argv.fold));
            console.log('');
        });


    }





};
