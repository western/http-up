

//const os = require('os');
const fs = require('fs');
//const url = require('url');
const urlencode = require('urlencode');
const colors = require('colors');

let config = require('./config');


exports.api_core = function(app, argv){

    //console.log('call api_core function');

    app.get('*', function (req, res) {
        let readFolder = process.cwd() + '/' + argv.fold + urlencode.decode(req.path);
        console.log('—'.repeat(process.stdout.columns));
        console.log('Looking path ' + colors.yellow(readFolder));

        let req_path = urlencode.decode(req.path);
        if (req_path.slice(-1) != '/') {
            req_path += '/';
        }

        fs.readdir(readFolder, (err, files) => {

            let arr_path = urlencode.decode(req.path).split(/\//);
            arr_path.shift();


            let breadcrumb_html = '';
            let breadcr = [];
            for (let a = 0; a < arr_path.length; a++) {
                let el = arr_path[a];

                breadcr.push(el);
                breadcrumb_html += `<li class="breadcrumb-item"><a href="/${breadcr.join('/')}">${el}</a></li>`;
            }

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
            </style>

            </head>
            <body>
            <br>
            <div class="container">

                <div class="row" style_="padding:20px 0;">

                    <h1>Index of ${req_path}</h1>

                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/"><i class="bi bi-house-door"></i></a></li>
                            ${breadcrumb_html}
                        </ol>
                    </nav>

                </div>

                <div class="row" style_="padding:20px 0;">

                    <div class="col">




                        <div class="input-group mb-3">

                            <input class="form-control" type="file" id="upload_file" multiple >


                            <span class="input-group-text visually-hidden" id="signal">
                                <i class="bi bi-check-lg " ></i>
                            </span>
                        </div>



                    </div>

                    <div class="col">
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" placeholder="New folder name" aria-label="New folder name" id="make_folder_input" >
                            <button class="btn btn-outline-secondary" type="button" id="make_folder_button">Make</button>
                        </div>
                    </div>

                </div>


                <div class="row" style="padding:20px 0;">
                <ul class="list-group">

            `;

            if (err && err.code == 'ENOTDIR') {
                let req_path = urlencode.decode(req.path);

                let filename = '';
                let filename_match = req_path.match(/([^\/]+)$/i);
                if (filename_match) {
                    filename = filename_match[0];
                }

                const data = fs.readFileSync(readFolder, 'binary');

                let content_type = 'application/x-binary';

                let content_type_match = req_path.match(/\.je?pg$/i);
                if (content_type_match) {
                    content_type = 'image/jpeg';
                }

                content_type_match = req_path.match(/\.png$/i);
                if (content_type_match) {
                    content_type = 'image/png';
                }

                content_type_match = req_path.match(/\.txt$/i);
                if (content_type_match) {
                    content_type = 'text/plain';
                }

                content_type_match = req_path.match(/\.docx?$/i);
                if (content_type_match) {
                    content_type = 'application/msword';
                }

                res.writeHead(200, {
                    'Content-Type': content_type,
                    //'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });
                res.end(new Buffer.from(data, 'binary'));

                console.log('out binary', {
                    'Content-Type': content_type,
                    //'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });

                return;
            }

            if (err && err.code == 'ENOENT') {

                let req_path = urlencode.decode(req.path);

                res.status(404).send('404 File not found');

                console.log('404 Not found', colors.yellow(req_path));

                return;
            }

            files.forEach((file) => {
                if (fs.lstatSync(readFolder + '/' + file).isDirectory()) {
                    body += `
                    <li class="list-group-item " >
                        <i class="bi bi-folder"></i> <a class="nodecor" href="${req_path}${file}">${file}</a>
                    </i>
                    `;
                } else {
                    body += `
                    <li class="list-group-item" style="background-color:#efefef;" >
                        <i class="bi bi-file-earmark"></i> <a class="nodecor" href="${req_path}${file}">${file}</a>
                    </i>
                    `;
                }
            });

            body += `
            </ul>
            </div>

            </div>




            <!--div class="container">
                <footer class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
                    <div class="col-md-4 d-flex align-items-center">
                        <a href="/" class="mb-3 me-2 mb-md-0 text-body-secondary text-decoration-none lh-1">
                            <i class="bi bi-bootstrap"></i>
                        </a>
                        <span class="mb-3 mb-md-0 text-body-secondary">Some about</span>
                    </div>

                    <ul class="nav col-md-4 justify-content-end list-unstyled d-flex">
                        <li class="ms-3"><a class="text-body-secondary" href="#"><i class="bi bi-twitter-x"></i></a></li>
                        <li class="ms-3"><a class="text-body-secondary" href="#"><i class="bi bi-instagram"></i></a></li>
                        <li class="ms-3"><a class="text-body-secondary" href="#"><i class="bi bi-facebook"></i></a></li>
                        <li class="ms-3"><a class="text-body-secondary" href="#"><i class="bi bi-github"></i></a></li>
                    </ul>
                </footer>
            </div-->




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
                        alert('Please insert folder name');
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

}

