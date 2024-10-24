'use strict';

const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const colors = require('colors');
const mime = require('mime');

const config = require('./config');
const util = require('./util');

exports.api_core = (app, argv) => {
    app.get('*', async (req, res) => {

        let readFolder = argv.fold + urlencode.decode(req.path);
        readFolder = util.http_path_clear(readFolder);



        let req_path = urlencode.decode(req.path);
        req_path = util.http_path_clear(req_path);


        if( req_path && req_path.startsWith('/__assets/') ){

            let cntx_arr = /\/__assets\/(.+)$/.exec(req_path);
            if( cntx_arr ){

                readFolder = path.join(process.cwd(), 'lib', 'assets');
                readFolder += '/' + cntx_arr[1];
            }
        }

        let clp = util.common_log_prefix(req);
        console.log(clp, 'Looking ' + colors.yellow(readFolder));




        fs.readdir(readFolder, (err, files) => {


            //let req_path = urlencode.decode(req.path);
            //if (req_path.slice(-1) != '/') {
            //    req_path += '/';
            //}
            //req_path = util.http_path_clear(req_path);



            if (err && err.code == 'ENOTDIR') {
                //let req_path = urlencode.decode(req.path);
                //req_path = util.http_path_clear(req_path);
                //console.log('req_path X=', req_path);

                let filename = '';
                let filename_match = req_path.match(/([^\/]+)$/i);
                if (filename_match) {
                    filename = filename_match[0];
                }

                let data;
                try {
                    data = fs.readFileSync(readFolder, 'binary');
                } catch (err) {
                    let clp = util.common_log_prefix(req);

                    if (err.code == 'EACCES') {
                        res.status(403).send(util.error_page_content('403', '403 Forbidden'));
                        console.log(clp, '403 Forbidden', colors.yellow(readFolder));
                    } else {
                        res.status(500).send(util.error_page_content('500', '500 Internal Server Error'));
                        console.log(clp, '500 Internal Server Error', colors.yellow(readFolder));
                    }

                    return;
                }

                let content_type = mime.getType(req_path);
                if (content_type == null) {
                    content_type = 'application/octet-stream';
                }

                let text_match = content_type.match(/(text|json|javascript)/i);
                if (text_match) {
                    content_type += ';charset=utf-8';
                }

                res.writeHead(200, {
                    'Content-Type': content_type,
                    //'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });
                res.end(new Buffer.from(data, 'binary'));

                let clp = util.common_log_prefix(req);
                console.log(clp, 'out file', {
                    Request: req_path,
                    'Content-Type': content_type,
                    //'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });

                return;
            }

            if (err && err.code == 'ENOENT') {
                res.status(404).send(util.error_page_content('404', '404 Not found'));

                let clp = util.common_log_prefix(req);
                console.log(clp, '404 Not found', colors.yellow(readFolder));

                return;
            }



            let body = prepare_file_list_template(argv, req, res, readFolder, req_path, files);

            res.send(body);
        });
    });
    // END app.get
};

let prepare_file_list_template = (argv, req, res, readFolder, req_path, files) => {
    if (req_path.slice(-1) != '/') {
        req_path += '/';
    }

    let arr_path = urlencode.decode(req.path).split(/\//);
    arr_path.shift();

    let breadcrumb_html = '';
    let breadcr = [];
    for (let a = 0; a < arr_path.length; a++) {
        let el = arr_path[a];

        breadcr.push(el);
        breadcrumb_html += `<li class="breadcrumb-item"><a class="nodecor" href="/${breadcr.join('/')}">${el}</a></li>`;
    }

    let upload_component_html = `
                <div class="input-group mb-3">
                    <input class="form-control" type="file" id="upload_file" multiple >

                    <span class="input-group-text visually-hidden" id="signal">
                        <i class="bi bi-upload " ></i>
                    </span>
                </div>
    `;

    if (argv['upload-disable']) {
        upload_component_html = '';
    }

    let folder_make_component_html = `
                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="New folder name" aria-label="New folder name" id="make_folder_input" >
                    <button class="btn btn-outline-secondary" type="button" id="make_folder_button">Do</button>
                </div>
    `;

    if (argv['folder-make-disable']) {
        folder_make_component_html = '';
    }

    let file_list_html = '';
    let file_list1 = [];
    let file_list2 = [];

    try {
        files.forEach((file) => {
            if (fs.lstatSync(readFolder + '/' + file).isDirectory()) {
                file_list1.push(`
                    <a href="${req_path}${file}" class="list-group-item list-group-item-action"><i class="bi bi-folder"></i> ${file}</a>
                `);
            } else {
                file_list2.push(`
                    <a style="background-color:#efefef;" href="${req_path}${file}" class="list-group-item list-group-item-action"><i class="bi bi-file-earmark"></i> ${file}</a>
                `);
            }
        });
    } catch (err) {
        let clp = util.common_log_prefix(req);

        if (err.code == 'EACCES') {
            res.status(403).send(util.error_page_content('403', '403 Forbidden'));
            console.log(clp, '403 Forbidden', colors.yellow(readFolder));
        } else {
            res.status(500).send(util.error_page_content('500', '500 Internal Server Error'));
            console.log(clp, '500 Internal Server Error', colors.yellow(readFolder));
        }

        return;
    }

    file_list_html = file_list1.join('') + file_list2.join('');

    if (files.length == 0) {
        file_list_html = `Empty folder`;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>

        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title></title>


        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" crossorigin="anonymous">

        <script>
        let config = {
            files_count_max:      ${config.files_count_max},
            fieldSize_max:        ${config.fieldSize_max},
            fieldSize_max_human: '${config.fieldSize_max_human}',
        };
        </script>

        <link href="/__assets/index.css" rel="stylesheet" crossorigin="anonymous">



    </head>
    <body>


    <br>
    <div class="container">


        <div class="row" style="padding:10px 0;">

            <div class="col">

                ${upload_component_html}

            </div>

            <div class="col">

                ${folder_make_component_html}

            </div>

        </div>

        <div class="row" style="padding:0 0;">

            <progress id="progress" max="100" value="0" >0</progress>

        </div>

        <div class="row" style="padding:10px 0;">


            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/"><i class="bi bi-house-door"></i></a></li>
                    ${breadcrumb_html}
                </ol>
            </nav>

        </div>


        <div class="row" style="padding:10px 0 100px 0;">
            <div class="list-group">

                ${file_list_html}

            </div>
        </div>


    </div>






    <script src="https://code.jquery.com/jquery-3.7.0.min.js" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>



    <script src="/__assets/index.js" crossorigin="anonymous"></script>


    </body>
    </html>
    `;
};
