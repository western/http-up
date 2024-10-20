'use strict';

const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const colors = require('colors');
const dateTime = require('node-datetime');
const mime = require('mime');

const config = require('./config');
const util = require('./util');

exports.api_core = function (app, argv) {
    app.get('*', function (req, res) {
        let readFolder = argv.fold + urlencode.decode(req.path);
        readFolder = util.http_path_clear(readFolder);

        let clp = util.common_log_prefix(req);
        console.log(clp, 'Looking ' + colors.yellow(readFolder));

        let req_path = urlencode.decode(req.path);
        if (req_path.slice(-1) != '/') {
            req_path += '/';
        }
        req_path = util.http_path_clear(req_path);

        fs.readdir(readFolder, (err, files) => {
            if (err && err.code == 'ENOTDIR') {
                let req_path = urlencode.decode(req.path);
                req_path = util.http_path_clear(req_path);

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
                    content_type = 'application/x-binary';
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
                                <i class="bi bi-check-lg " ></i>
                            </span>
                        </div>
            `;

            if ('upload-disable' in argv) {
                upload_component_html = '';
            }

            let folder_make_component_html = `
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" placeholder="New folder name" aria-label="New folder name" id="make_folder_input" >
                            <button class="btn btn-outline-secondary" type="button" id="make_folder_button">Do</button>
                        </div>
            `;

            if ('folder-make-disable' in argv) {
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

            let body = `
            <!DOCTYPE html>
            <html lang="en">
            <head>

                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title></title>



                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" crossorigin="anonymous">

                <style>
                a.nodecor {
                    text-decoration: none;
                }
                ul.list-group{
                    padding: 0 12px;
                }

                li.breadcrumb-item {
                    font-size: 18px;

                }
                li.breadcrumb-item i{

                    margin-right: 10px;
                }

                li.list-group-item{
                    font-size: 18px;
                }
                li.list-group-item i{
                    margin-right: 10px;
                }


                div.list-group {
                    padding: 0 12px;
                }

                div.list-group a {
                    font-size: 18px;

                }
                div.list-group a i{

                    margin-right: 10px;
                }


                </style>


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





            <script>
            $(document).ready(function(){

                $('#upload_file').on('change', function(ev){

                    return ev_target_files(ev.target.files);

                    //return ev_target_files_base64(ev.target.files);
                });

                let make_new_folder = function(ev){

                    let val = $('input[type=text]', ev.target.parentNode).val();
                    console.log('val=', val);

                    if ( val.length == 0 ){
                        alert('Please fill folder name');
                        return;
                    }

                    let formData = new FormData();

                    formData.append('name', val);


                    $.ajax({
                        url: '/api/folder',
                        data: formData,
                        type: 'POST',
                        contentType: false,
                        processData: false,
                    }).done(function( data ) {

                        if( data.code == 200 ){
                            location.href = location.href;
                        }
                    });

                };

                $('#make_folder_button').click(function(ev){

                    make_new_folder(ev);
                });

                $('#make_folder_input').on('keypress', function(ev){

                    if(ev.which == 13) {
                        make_new_folder(ev);
                    }
                });

            });


            function ev_target_files(files){
                $('#signal').removeClass('visually-hidden');


                if ( files.length > ${config.files_count_max} ){

                    alert('Count of files is more than ${config.files_count_max}.');
                    location.href = location.href;
                    return;
                }

                let formData = new FormData();
                Array.prototype.forEach.call(files, function(file) {


                    if ( file.size > ${config.fieldSize_max} ){
                        alert( 'File "' + file.name + '" size is overload "${config.fieldSize_max_human}"');
                    }else{

                        formData.append('fileBlob', file);
                        formData.append('fileMeta', JSON.stringify({
                            lastModified: file.lastModified,
                            lastModifiedDate: file.lastModifiedDate,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        }));
                    }
                });

                let submit = async function() {

                    let response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    let result = await response.json();
                    if(result.code == 200){
                        location.href = location.href;
                    }
                };

                submit();
                return;
            }

            function ev_target_files_base64(files){
                let arr = [];
                let file_meta = [];
                Array.prototype.forEach.call(files, function(file) {
                    arr.push(file);
                    file_meta.push({
                        lastModified: file.lastModified,
                        lastModifiedDate: file.lastModifiedDate,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    });
                });

                Promise.all(arr.map(convertFileToBase64)).then((promise_arr_result) => {

                    let formData = new FormData();

                    promise_arr_result.map(function (pr) {
                        formData.append('fileBase', pr.base64_source);
                    });

                    file_meta.map(function (pr) {
                        formData.append('fileMeta', JSON.stringify(pr));
                    });


                    $.ajax({
                        url: '/api/upload',
                        data: formData,
                        type: 'POST',
                        contentType: false,
                        processData: false,
                    }).done(function( data ) {

                        if( data.code == 200 ){
                            location.href = location.href;
                        }
                    });
                });

                return;
            }


            const convertFileToBase64 = (file) =>
            new Promise((resolve, reject) => {
                if (file.id) {
                    resolve(file);
                } else {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ rawFile: file, base64_source: reader.result });
                    reader.onerror = reject;

                    reader.readAsDataURL(file);
                }
            });

            </script>


            </body>
            </html>
            `;

            res.send(body);
        });
    });
};
