'use strict';

const fs = require('fs');
const dateTime = require('node-datetime');
const path = require('path');
const shell = require('shelljs');

exports.http_path_clear = (p) => {
    p = p.replace(/\.\./g, '');
    p = p.replace(/\/{2,}/g, '/');
    p = path.normalize(p);
    return p;
};

exports.get_ext_norm = (p) => {
    let ext = path.parse(p).ext;
    ext = ext.toLowerCase();
    ext = ext.replace(/\./g, '');
    if (ext == 'jpeg') {
        ext = 'jpg';
    }
    return ext;
};

exports.get_name = (p) => {
    let name = path.parse(p).name;
    return name;
};

exports.common_log_prefix = (req) => {
    let client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    client_ip = client_ip.toString();

    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');

    if (req.auth && req.auth.user) {
        return `[${formatted}] [${client_ip}] [${req.auth.user}]`;
    }

    return `[${formatted}] [${client_ip}] []`;
};

exports.error_page_content = (h1_title, msg) => {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>

                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title></title>

                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" crossorigin="anonymous">

            </head>
            <body>

            <br>
            <div class="container">

                <div class="row text-center" style="padding:50px 0;">

                    <h1><i class="bi bi-exclamation-triangle"></i> ${h1_title}</h1>

                    <p>${msg}</p>

                </div>

            </div>
            </body>
            </html>
    `;
};

exports.random_string = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=:;[]{}';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

exports.random_ansi_string = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

exports.getcookie = (req, nme) => {
    let cookie = req.headers.cookie;
    // user=someone; session=mySessionID
    let cookies_hash = {};

    if (cookie) {
        cookie.split('; ').forEach((element) => {
            //console.log(element)
            let ck_arr = element.split('=');
            if (ck_arr) {
                cookies_hash[ck_arr[0]] = ck_arr[1];
            }
        });
    }

    if (nme && nme in cookies_hash) {
        return cookies_hash[nme];
    }

    if (nme && !(nme in cookies_hash)) {
        return undefined;
    }

    /*
    if(cookie){
        return cookie.split('; ');
    }*/

    return undefined;
};

exports.humanFileSize = (bytes, si = false, dp = 1) => {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
};

// openssl aes-256-cbc -a -salt -in file.txt -out file.txt.cr -pass pass:123
//
// util.CryptFile("path/to", "pass")
//
exports.CryptFile = (full_path, pass) => {
    if (shell.exec('openssl --help', { silent: true }).code !== 0) {
        console.log('Error: openssl not found');
        //shell.exit(1);
        //process.exit();

        return;
    }

    if (full_path.length == 0) {
        console.log('Error: full_path is empty');
        return;
    }

    if (pass.length == 0) {
        console.log('Error: Pass is empty');
        return;
    }

    let dir = path.dirname(full_path);

    let from_file = exports.get_name(full_path);
    let to_file = exports.get_name(full_path) + '.cr';

    shell.cd(dir);

    if (shell.exec(`openssl aes-256-cbc -a -salt -in ${from_file} -out ${to_file} -pass pass:${pass} `, { silent: true }).code !== 0) {
        console.log('Error: openssl error');
        shell.exit(1);
        process.exit();
    }

    fs.unlinkSync(full_path);

    fs.rename(path.join(dir, to_file), full_path, (err) => {
        if (err) {
            console.log('fs.rename', 'err=', err);
        }
    });
};

// openssl aes-256-cbc -d -a -in file.txt.cr -out file.txt.new -pass pass:123
//
// util.DecryptFile("path/to", "pass")
//
exports.DecryptFile = (full_path, pass) => {
    if (shell.exec('openssl --help', { silent: true }).code !== 0) {
        console.log('Error: openssl not found');
        //shell.exit(1);
        //process.exit();

        return;
    }

    if (full_path.length == 0) {
        console.log('Error: full_path is empty');
        return;
    }

    if (pass.length == 0) {
        console.log('Error: Pass is empty');
        return;
    }

    let dir = path.dirname(full_path);

    let from_file = exports.get_name(full_path);
    let to_file = exports.get_name(full_path) + '.decr';

    shell.cd(dir);

    //console.log( `openssl aes-256-cbc -d -a -in ${from_file} -out ${to_file} -pass pass:${pass} ` );

    if (shell.exec(`openssl aes-256-cbc -d -a -in ${from_file} -out ${to_file} -pass pass:${pass} `, { silent: true }).code !== 0) {
        //console.log('Error: openssl error');
        //shell.exit(1);
        //process.exit();
    }

    fs.unlinkSync(full_path);

    fs.rename(path.join(dir, to_file), full_path, (err) => {
        if (err) {
            console.log('fs.rename', 'err=', err);
        }
    });
};
