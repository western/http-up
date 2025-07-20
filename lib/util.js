import path from 'node:path';
//import { fileURLToPath } from 'node:url';
import * as urlencode from 'urlencode';
import url from 'node:url';

export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const http_path_clear = (p) => {
    p = p.replace(/\.\./g, '');
    p = p.replace(/\/{2,}/g, '/');

    return p;
};

export const get_referer_or_path = (req) => {
    let ret = '';

    if (req && req.headers && req.headers.referer) {
        ret = urlencode.decode(url.parse(req.headers.referer).pathname);
    }

    if (req.body && req.body.path) {
        ret = req.body.path;
    }
    ret = http_path_clear(ret);

    return ret;
};

export const get_ext_norm = (p) => {
    let ext = path.parse(p).ext;
    ext = ext.toLowerCase();
    ext = ext.replace(/\./g, '');
    if (ext == 'jpeg') {
        ext = 'jpg';
    }
    return ext;
};

export const get_name = (p) => {
    let name = path.parse(p).name;
    return name;
};

export const error_page_content = (h1_title, msg) => {
    let icon = ``;

    if (h1_title == '500') {
        icon = `<i class="bi bi-exclamation-triangle"></i>`;
    }

    if (h1_title == '403' || h1_title == '401') {
        icon = `<i class="bi bi-ban"></i>`;
    }

    if (h1_title == '404') {
        icon = `<i class="bi bi-x-circle"></i>`;
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>

            <meta charset="UTF-8" />
            <link rel="icon" href="data:;base64,=">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title></title>

            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" crossorigin="anonymous">

        </head>
        <body>

        <br>
        <div class="container">

            <div class="row _text-center" style="padding:50px 0;">

                <h1>${icon} ${h1_title}</h1>
                
                
                <p>${msg}</p>
                
                <hr/>

            </div>

        </div>
        </body>
        </html>
    `;
};

export const random_string = (length) => {
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

export const random_ansi_string = (length) => {
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

export const getcookie = (req, nme) => {
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

export const humanFileSize = (bytes, si = false, dp = 1) => {
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

export const string_color_clear = (msg) => {
    return msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};
