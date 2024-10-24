'use strict';

const dateTime = require('node-datetime');

exports.http_path_clear = (p) => {
    p = p.replace(/\.\./g, '');
    p = p.replace(/([^:]\/)\/+/g, '$1');
    //p = p.replace(/(?<!:)\/+/g, '/');
    return p;
};

exports.common_log_prefix = (req) => {
    let client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    client_ip = client_ip.toString();

    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');

    if (req.auth && req.auth.user) {
        return `[${formatted}] [${client_ip}] [${req.auth.user}]`;
    }

    return `[${formatted}] [${client_ip}]`;
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

exports.getcookie = (req, nme) => {
    let cookie = req.headers.cookie;
    // user=someone; session=mySessionID
    let cookies_hash = {};

    if(cookie){
        cookie.split('; ').forEach((element) => {
            //console.log(element)
            let ck_arr = element.split('=');
            if( ck_arr ){
                cookies_hash[ck_arr[0]] = ck_arr[1];
            }
        })
    }

    if( nme && nme in cookies_hash ){
        return cookies_hash[nme];
    }

    if( nme && !(nme in cookies_hash) ){
        return undefined;
    }

    /*
    if(cookie){
        return cookie.split('; ');
    }*/

    return undefined;
}
