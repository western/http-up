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


        let current_folder = __dirname;
        console.log('current_folder=', current_folder);

        //shell.echo('Sorry, this script requires git');
        //shell.exit(1);

        if (shell.exec('git commit -am "Auto-commit"').code !== 0) {
            shell.echo('Error: Git commit failed');
            shell.exit(1);
        }




        process.exit();

        const serverOptions = {

            cert: fs.readFileSync(path.join(__dirname, 'certs/server1.crt')),
            key: fs.readFileSync(path.join(__dirname, 'certs/server1.key')),

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
