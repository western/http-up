'use strict';

const dateTime = require('node-datetime');

exports.common_log_prefix = function (req) {
    let client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    client_ip = client_ip.toString();

    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');

    return `[${formatted}] [${client_ip}]`;
};

exports.error_page_content = function (h1_title, msg) {
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

exports.random_string = function (length) {
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
