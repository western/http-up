import fs from 'node:fs/promises';

import chalk from 'chalk';
import * as dateTime from 'node-datetime';

import * as util from '../lib/util.js';
import * as model from '../model/index.js';

const message_builder = (res, req, code, tag, ...msg) => {
    let argv;
    if (res) {
        argv = res.locals.argv;
    }

    // ---------------------------------------------------------------------------------------------

    let ret = [];

    if (process.pid) {
        ret.push(process.pid);
    }

    let dt = dateTime.create();
    let dt_formatted = dt.format('Y-m-d H:M:S.N');
    ret.push(dt_formatted);

    // client_ip -----------------------------------------------------------------------------------
    let client_ip = '0.0.0.0';
    if (req) {
        try {
            client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            client_ip += '';
            ret.push(client_ip);
        } catch (err) {
            client_ip = '0.0.0.0';
        }
    } else {
        ret.push('');
    }

    // req_auth_user -------------------------------------------------------------------------------
    let req_auth_user = '';
    if (req && req.auth && req.auth.user) {
        ret.push(req.auth.user);
        req_auth_user = req.auth.user;
    } else {
        ret.push('');
    }

    // code ----------------------------------------------------------------------------------------
    let color = 'green';
    if (code) {
        if (code != 200) {
            color = 'red';
        }

        ret.push(chalk[color](code));
    } else {
        code = '';
        ret.push('');
    }

    ret.push(tag);

    if (argv && !argv['silence']) {
        console.log(chalk[color]('|') + ' [' + ret.join('] [') + ']', ...msg);
    }

    return [process, dt_formatted, client_ip, req_auth_user, ret];
};

export const write = (res, req, code, tag, ...msg) => {
    let argv;
    if (res) {
        argv = res.locals.argv;
    }

    // ---------------------------------------------------------------------------------------------

    const [process, dt_formatted, client_ip, req_auth_user, ret] = message_builder(res, req, code, tag, ...msg);

    // log ------------------------------------------------------------------------------------

    if (argv && argv['logto']) {
        let record_str = ' [' + ret.join('] [') + '] ' + msg.join(' ');
        record_str = util.string_color_clear(record_str);
        record_str += '\n';

        fs.appendFile(argv['logto'], record_str, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    if (argv && argv['jsonto']) {
        let record_obj = {
            ProcId: process.pid,
            DT: dt_formatted,

            IP: client_ip,
            Login: req_auth_user,

            Code: code,

            Tag: tag,
            Msg: util.string_color_clear(msg.join(' ')),
        };

        let record_str = JSON.stringify(record_obj, null, 4);
        record_str += ',\n';

        fs.appendFile(argv['jsonto'], record_str, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
};

export const print = (res, req, code, tag, ...msg) => {
    message_builder(res, req, code, tag, ...msg);
};
