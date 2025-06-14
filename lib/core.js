import os from 'os';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as urlencode from 'urlencode';

import express from 'express';
import compression from 'compression';
import { engine } from 'express-handlebars';

//import basicAuth from 'express-basic-auth';
import { basicAuth3 } from '../lib/express-basic-auth3.js';

import config from '../lib/config.js';
import * as model from '../model/index.js';
import * as api from '../lib/api/index.js';
import * as thumb from '../lib/thumb.js';
import * as edit from '../lib/edit.js';
import * as openssl from '../lib/openssl.js';
import * as search from '../lib/search.js';
import * as player from '../lib/player.js';
import * as util from '../lib/util.js';

const makeServer = async (argv) => {
    // -----------------------------------------------------------------------------------------------------------------------
    // MAKE FOLDERS

    fs.stat(config.httpup_home, {}, (err, stats) => {
        if (err && err.code == 'ENOENT') {
            fs.mkdir(config.httpup_home, { recursive: false }, (err) => {});
        }
    });

    fs.stat(config.httpup_thumb, {}, (err, stats) => {
        if (err && err.code == 'ENOENT') {
            fs.mkdir(config.httpup_thumb, { recursive: false }, (err) => {});
        }
    });

    fs.stat(config.httpup_temp, {}, (err, stats) => {
        if (err && err.code == 'ENOENT') {
            fs.mkdir(config.httpup_temp, { recursive: false }, (err) => {});
        } else {
            
            fs.rm(config.httpup_temp, { recursive: true, force: true }, (err) => {
                fs.mkdir(config.httpup_temp, { recursive: false }, (err) => {
                });
            });
            
        }
    });

    fs.stat(config.httpup_db, {}, (err, stats) => {
        if (err && err.code == 'ENOENT') {
            fs.mkdir(config.httpup_db, { recursive: false }, (err) => {});
        }
    });

    // -----------------------------------------------------------------------------------------------------------------------
    // DATABASE

    //let db;
    if (argv.usedb) {
        //let db = model.connect();
        //model.init_db(db);
        model.init_db();
    }

    // -----------------------------------------------------------------------------------------------------------------------
    // EXPRESS

    const app = express();

    app.disable('x-powered-by');

    //console.log();
    //console.log('CORE', 'import.meta.filename=', import.meta.filename);
    //console.log('CORE', 'config.__rootdir=', config.__rootdir);
    //console.log();

    //console.log('CORE', 'view=', path.join(config.__rootdir, 'view'));
    //console.log('');

    app.engine('.hbs', engine({ extname: '.hbs' }));
    app.set('view engine', '.hbs');

    app.set('views', path.join(config.__rootdir, 'view'));
    app.enable('view cache'); // enable cache template

    app.use(compression());

    app.use((req, res, next) => {
        res.locals.argv = argv;

        /*
        if (argv.usedb) {
            res.locals.db = db;
        }
        */

        next();
    });

    // -----------------------------------------------------------------------------------------------------------------------
    // SHOW SETUP INFO

    

    

    console.log();

    if (argv.basic) {
        console.log('--basic basic auth enable');
    }
    if (argv['upload-disable']) {
        console.log('--upload-disable flag enable');
    }
    if (argv['folder-make-disable']) {
        console.log('--folder-make-disable flag enable');
    }
    if (argv['share-only']) {
        console.log('--share-only flag enable');
    }
    if (argv.tls) {
        console.log('--tls flag enable');
    }
    if (argv['tls-debug']) {
        console.log('--tls-debug flag enable');
    }
    if (argv['extend-mode']) {
        console.log('--extend-mode flag enable');
    }
    if (argv.crypt) {
        console.log('--crypt flag enable');
    }
    if (argv.silence) {
        console.log('--silence flag enable');
    }
    if (argv.usedb) {
        console.log('--usedb flag enable');
    }

    console.log('');

    // -----------------------------------------------------------------------------------------------------------------------

    if (argv.login && argv.password) {
        console.log(chalk.yellow('Set basic authorization:'));

        console.log('        ', argv.login, '       ', argv.password);
        console.log('');

        app.use(
            basicAuth3({
                users: { [argv.login]: argv.password },
                challenge: true,
                unauthorizedResponse: (req, res) => {
                    if (!req.auth) {
                        let req_path = urlencode.decode(req.path);
                        req_path = util.http_path_clear(req_path);

                        //console.log('401', req_path);
                        model.event_log.write(res, req, 401, 'basicAuth', '401 Unauthorized ' + chalk.yellow(req_path));

                        return util.error_page_content('401', '401 Unauthorized');
                    }
                },
            }),
        );
    }

    if (argv.basic) {
        console.log(chalk.yellow('Set basic authorization:'));

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
            basicAuth3({
                users: userz,
                challenge: true,
                unauthorizedResponse: (req, res) => {
                    if (!req.auth) {
                        let req_path = urlencode.decode(req.path);
                        req_path = util.http_path_clear(req_path);

                        //console.log('401', req_path);
                        model.event_log.write(res, req, 401, 'basicAuth', '401 Unauthorized ' + chalk.yellow(req_path));

                        return util.error_page_content('401', '401 Unauthorized');
                    }
                },
            }),
        );
    }

    // -----------------------------------------------------------------------------------------------------------------------
    // API

    

    if (!argv['upload-disable']) {
        api.post_file(app, argv);
    }

    if (!argv['folder-make-disable']) {
        api.post_folder(app, argv);
        api.post_file_touch(app, argv);
    }

    if (argv['extend-mode']) {
        api.post_delete(app, argv);
        api.post_move(app, argv);
        api.post_copy(app, argv);
        api.post_rename(app, argv);
        api.post_zip(app, argv);

        thumb.api_thumb(app, argv);
        edit.api_edit(app, argv);

        search.search_result(app, argv);
    }

    player.player_page(app, argv);
    api.get_all(app, argv);

    // -----------------------------------------------------------------------------------------------------------------------
    // LISTEN

    if (argv.tls) {
        let https;

        try {
            
            https = await import('node:https');
        } catch (err) {
            console.error('https support is disabled!');
            return;
        }

        openssl.openssl_make_keys(argv);

        console.log('crt:', path.join(config.httpup_home, '/tls/server.crt'));
        console.log('key:', path.join(config.httpup_home, '/tls/server.key'));
        console.log('');

        const serverOptions = {
            cert: fs.readFileSync(path.join(config.httpup_home, '/tls/server.crt')),
            key: fs.readFileSync(path.join(config.httpup_home, '/tls/server.key')),

            maxVersion: 'TLSv1.3',
            minVersion: 'TLSv1.2',
        };

        //console.log('https=', https);

        const server = https.Server(serverOptions, app);

        server.listen(argv.port, '0.0.0.0', (err) => {
            console.log('Server TLS start:', chalk.green(argv.port));

            if (err) {
                console.log('HTTPS app.listen err=', err);
                return;
            }

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
            console.log('');
            console.log('[' + chalk.yellow('Control + C') + '] for server stop');
            console.log('');
        });
    } else {
        app.listen(argv.port, '0.0.0.0', (err) => {
            console.log('Server start:', argv.port);

            if (err) {
                console.log('app.listen err=', err);
                return;
            }

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
            console.log('');
            console.log('[' + chalk.yellow('Control + C') + '] for server stop');
            console.log('');
        });
    }
};

export { makeServer };
