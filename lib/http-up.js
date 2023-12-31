
'use strict';

const os = require('os')
const fs = require('fs')
const url = require('url')
const urlencode = require('urlencode')
const express = require('express')
const colors = require('colors')







exports.makeServer = function ( argv ) {



    const app = express()








    const multer  = require('multer')
    const upload = multer({ dest: '/tmp', limits: { fieldSize: 250 * 1024 * 1024 } })

    const flUpload = upload.fields([{ name: 'fileBase', maxCount: 10 }, { name: 'fileMeta', maxCount: 10 }, { name: 'fileBlob', maxCount: 10 }])


    app.post('/api/upload', flUpload, function (req, res) {


        let readFolder = process.cwd() + '/' + argv.fold + url.parse(req.headers.referer).pathname
        readFolder = urlencode.decode(readFolder)
        if( readFolder.slice(-1) != '/' ){
            readFolder += '/';
        }
        console.log('—'.repeat(process.stdout.columns));
        console.log('Upload files to '+colors.yellow(readFolder));
        console.log('');




        if( typeof req.body.fileBase == 'object' ){


            for(let a=0; a<req.body.fileBase.length; a++){
                let f = req.body.fileBase[a];
                let m = JSON.parse(req.body.fileMeta[a]);

                f = f.replace(/^data:(.+?);base64,/, '');
                m.name = m.name.replace(/[^0-9a-zа-я\-\_\. ]+/ig, '');

                var buf = Buffer.from(f, 'base64');
                fs.writeFile(readFolder + m.name, buf,  "binary",function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log('The file '+colors.green(readFolder + m.name)+' was saved');
                        console.log('Size: '+colors.green(buf.length));
                        console.log('');
                    }
                });
            }

        }else if( typeof req.body.fileBase == 'string' ){

            let f = req.body.fileBase;
            let m = JSON.parse(req.body.fileMeta);

            f = f.replace(/^data:(.+?);base64,/, '');
            m.name = m.name.replace(/[^0-9a-zа-я\-\_\. ]+/ig, '');

            var buf = Buffer.from(f, 'base64');
            fs.writeFile(readFolder + m.name, buf,  "binary",function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log('The file '+colors.green(readFolder + m.name)+' was saved');
                    console.log('Size: '+colors.green(buf.length));
                    console.log('');
                }
            });

        }else if( typeof req.files.fileBlob == 'object' ){




            let req_body_fileMeta = [];
            if( typeof req.body.fileMeta == 'string' ){
                req_body_fileMeta.push( JSON.parse(req.body.fileMeta) )
            }else if( typeof req.body.fileMeta == 'object' ){
                req.body.fileMeta.forEach(function(el, indx){
                    req_body_fileMeta.push( JSON.parse(el) )
                });
            }



            for(let a=0; a<req.files.fileBlob.length; a++){
                let f = req.files.fileBlob[a];
                let m = req_body_fileMeta[a];

                m.name = m.name.replace(/\s{1,}/g, '-');
                m.name = m.name.replace(/[^0-9a-zа-яА-Я\-\_\.]+/ig, '');

                fs.copyFile( f.path, readFolder + m.name, fs.constants.COPYFILE_EXCL, function(err){
                    if(err){
                        console.log('fs.copyFile', 'err=', err);
                    }else{
                        console.log('The file '+colors.green(readFolder + m.name)+' was saved');
                        console.log('Size: '+colors.green(f.size));
                        console.log('');
                    }
                })
            }


        }




        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ code: 200 }));
    });








    app.get('*', function (req, res) {




        let readFolder = process.cwd() + '/' + argv.fold + urlencode.decode(req.path)
        console.log('—'.repeat(process.stdout.columns));
        console.log('Looking path '+colors.yellow( readFolder ))

        let req_path = urlencode.decode(req.path);
        if( req_path.slice(-1) != '/' ){
            req_path += '/';
        }





        fs.readdir(readFolder, (err, files) => {

            let arr_path = urlencode.decode(req.path).split(/\//);
            arr_path.shift();


            let breadcrumb_html = '';
            let breadcr = [];
            for(let a=0;a<arr_path.length;a++){
                let el = arr_path[a];

                breadcr.push(el);
                breadcrumb_html += `<li class="breadcrumb-item"><a href="/${breadcr.join('/')}">${el}</a></li>`;
            };


            let body = `
            <!DOCTYPE html>
            <html lang="en">
            <head>

            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title></title>

            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" rel="stylesheet" crossorigin="anonymous">

            </head>
            <body>
            <br>
            <div class="container">

            <div class="row" style="padding:20px 0;">

                <h1>Index of ${req_path}</h1>

                <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/"><i class="bi bi-house-door"></i></a></li>
                ${breadcrumb_html}
                </ol>
                </nav>

                <form method=post enctype="multipart/form-data" action="/api/upload">
                    <input type="file" multiple >
                    <i class="bi bi-check-lg visually-hidden" id="signal"></i>
                    <br>
                </form>

            </div>

            <div class="row" style="padding:20px 0;">
            <ul class="list-group">

            `;






            if(err && err.code == 'ENOTDIR'){

                let req_path = urlencode.decode(req.path);


                let filename = '';
                let filename_match = req_path.match(/([^\/]+)$/i)
                if( filename_match ){
                    filename = filename_match[0];
                }




                const data = fs.readFileSync(readFolder, 'binary');




                let content_type = 'application/x-binary';
                let content_type_match = req_path.match(/\.je?pg$/i)
                if( content_type_match ){
                    content_type = 'image/jpeg';
                }
                content_type_match = req_path.match(/\.txt$/i)
                if( content_type_match ){
                    content_type = 'text/plain';
                }
                content_type_match = req_path.match(/\.docx?$/i)
                if( content_type_match ){
                    content_type = 'application/msword';
                }




                res.writeHead(200, {
                    'Content-Type': content_type,
                    'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });
                res.end(new Buffer.from(data, 'binary'));


                console.log('out binary', {
                    'Content-Type': content_type,
                    'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                    'Content-Length': data.length,
                });


                return
            }

            if(err && err.code == 'ENOENT'){
                res.status(404);
                return res.send(`404 File not found`)
            }




            files.forEach(file => {

                if( fs.lstatSync(readFolder + '/' + file).isDirectory() ){
                    body += `
                    <li class="list-group-item " style="background-color:#efefef;">
                        <i class="bi bi-folder"></i> <a href="${req_path}${file}">${file}</a>
                    </i>
                    `;
                }else{
                    body += `
                    <li class="list-group-item">
                        <i class="bi bi-file-earmark"></i> <a href="${req_path}${file}">${file}</a>
                    </i>
                    `;
                }
            });



            body += `
            </ul>
            </div>

            </div>

            <script src="https://code.jquery.com/jquery-3.7.0.min.js" crossorigin="anonymous"></script>
            <!--script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"  crossorigin="anonymous"></script-->

            <script>
            $(document).ready(function(){

                $('input[type=file]').on('change', function(ev){

                    return ev_target_files(ev.target.files);

                    //return ev_target_files_base64(ev.target.files);
                });
            });


            function ev_target_files(files){
                $('#signal').removeClass('visually-hidden');

                let formData = new FormData();
                Array.prototype.forEach.call(files, function(file) {
                    formData.append('fileBlob', file);
                    formData.append('fileMeta', JSON.stringify({
                        lastModified: file.lastModified,
                        lastModifiedDate: file.lastModifiedDate,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    }));
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



            res.send( body )
        });



    })

    let ifaces = os.networkInterfaces();

    app.listen( argv.port );

    console.log('');
    console.log('Server start :', argv.port);
    Object.keys(ifaces).forEach(k => {
        ifaces[k].forEach(el => {

            if( el.family && el.family == 'IPv4' ){
                console.log('   http://'+el.address+colors.green(':'+argv.port));
            }
        });
    });
    console.log('');
    console.log('folder serve :', process.cwd() + '/' + argv.fold);
    console.log('');



};

