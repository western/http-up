'use strict';

const os = require('os');
//const fs = require('fs');
//const url = require('url');
//const urlencode = require('urlencode');

const express = require('express');
const basicAuth = require('express-basic-auth');
const colors = require('colors');



const api = require('./http-up-api.js');
const core = require('./http-up-core.js');


exports.makeServer = function (argv) {

    const app = express();

    if( argv.user && argv.password ){
        app.use(basicAuth({
            users: { [argv.user]: argv.password },
            challenge: true,
            realm: 'egjiXnPrSia',
        }));
    }

    if( !argv.hasOwnProperty('upload-disable')  ){
        api.api_upload(app, argv);
    }

    if( !argv.hasOwnProperty('folder-make-disable')  ){
        api.api_folder(app, argv);
    }

    core.api_core(app, argv);




    app.listen(argv.port);

    console.log('');
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
    console.log('folder serve:', argv.fold);
    console.log('');
};
