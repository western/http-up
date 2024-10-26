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

        let is_asset = false;
        if( req_path && req_path.startsWith('/__assets/') ){

            let cntx_arr = /\/__assets\/(.+)$/.exec(req_path);
            if( cntx_arr ){

                readFolder = path.join(__dirname,  'assets');
                readFolder += '/' + cntx_arr[1];
                is_asset = true;
            }
        }

        if( !is_asset ){
            let clp = util.common_log_prefix(req);
            console.log(clp, 'Looking ' + colors.yellow(readFolder));
        }




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

                if( !is_asset ){
                    let clp = util.common_log_prefix(req);
                    console.log(clp, 'out file', {
                        Request: req_path,
                        'Content-Type': content_type,
                        //'Content-disposition': 'attachment;filename=' + urlencode.encode(filename),
                        'Content-Length': data.length,
                    });
                }

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

                    <span class="input-group-text blink_me visually-hidden" id="signal">
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





    let mode = 'list'; // fold_thumb, folder_file, list


    if( util.getcookie(req, 'mode') ){
        mode = util.getcookie(req, 'mode');
    }

    if( req.query.mode ){
        mode = req.query.mode;
    }

    res.cookie('mode', mode);
    //console.log('mode=', mode);





    let file_list1 = [];
    let file_tree1 = [];
    let file_list2 = [];
    let file_list2_src = [];

    let tree_walk = (fold_name, cnt_deep) => {

        if( cnt_deep > 2 ){
            return;
        }

        let readFolder2 = path.join(argv.fold, fold_name);
        readFolder2 = util.http_path_clear(readFolder2);



        let nodes = [];

        try{
            let files2 = fs.readdirSync(readFolder2);

            if(files2){
                try{
                    files2.forEach((file2) => {

                        let stats = fs.lstatSync(path.join(readFolder2 , file2));
                        let nodes_;

                        if (stats.isDirectory()) {

                            nodes_ = tree_walk(path.join(fold_name , file2), cnt_deep+1 );

                            let nd = {
                                text: file2,
                                href: path.join(fold_name, file2),
                                icon: "bi bi-folder",
                                expanded: true,
                                nodes: nodes_,
                            };
                            nodes.push(nd);
                        }


                    })
                } catch(err3){

                }
            }


        } catch(err4){

        }

        return nodes;

    };

    try {
        files.forEach((file) => {

            let stats = fs.lstatSync(readFolder + '/' + file);


            if (stats.isDirectory()) {
                file_list1.push(`
                    <a href="${req_path}${file}" class="list-group-item list-group-item-action folder"><i class="bi bi-folder"></i> ${file}</a>
                `);


                if( mode != 'list' ){
                    let nodes2 = tree_walk(path.join(req_path, file), 1);

                    let nd = {
                        text: file,
                        href: path.join(req_path, file),
                        icon: "bi bi-folder",
                        expanded: true,
                        nodes: nodes2,
                    };
                    file_tree1.push(nd);
                }

            } else {
                file_list2.push(`
                    <a  href="${req_path}${file}" class="list-group-item list-group-item-action file"><i class="bi bi-file-earmark"></i> ${file}</a>
                `);


                let ext = path.parse(file).ext;
                ext = ext.replace(/\./g, '');

                let img_preview = `/__assets/document-128.png`;
                if( ext == 'jpg' ){
                    img_preview = `${req_path}${file}`;
                }


                let fileSizeInBytes = stats.size;
                //let fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
                //console.log('fileSizeInMegabytes', fileSizeInMegabytes);
                //fileSizeInMegabytes = parseFloat(fileSizeInMegabytes.toFixed(1));
                //console.log('fileSizeInMegabytes', fileSizeInMegabytes);
                let fileSizeInHuman = util.humanFileSize(stats.size);

                file_list2_src.push(`
                    <div class="col-lg-3 col-xl-3">
                        <div class="file-man-box"><!--a href="" class="file-close"><i class="bi bi-x-circle"></i></a-->
                            <div class="file-img-box"><img src="${img_preview}" alt=""></div><a href="${req_path}${file}" class="file-download"><i class="bi bi-box-arrow-down"></i></a>
                            <div class="file-man-title">
                                <h6 class="mb-0 text-overflow">${file}</h6>
                                <p class="mb-0"><small>${fileSizeInHuman}</small></p>
                            </div>
                        </div>
                    </div>
                `);
            }
        });
    } catch (err) {
        let clp = util.common_log_prefix(req);

        console.log('err inside files=', err);

        if (err.code == 'EACCES') {
            res.status(403).send(util.error_page_content('403', '403 Forbidden'));
            console.log(clp, '403 Forbidden', colors.yellow(readFolder));
        } else {
            res.status(500).send(util.error_page_content('500', '500 Internal Server Error'));
            console.log(clp, '500 Internal Server Error', colors.yellow(readFolder));
        }

        return;
    }





    //console.log('req.cookies=', util.getcookie(req));
    //console.log('req.cookies.mode=', util.getcookie(req, 'mode'));
    //console.log('file_tree1=', JSON.stringify(file_tree1, null, 4)  );
    file_tree1 = JSON.stringify(file_tree1);





    let folder_list_html = '';
    let file_list_html = '';
    let file_list_html_thum = file_list2_src.join('');
    let main_container_class = 'container';


    //folder_list_html = file_list1.join('');
    file_list_html = file_list1.join('') + file_list2.join('');
    //file_list_html =  file_list2.join('');

    if (files.length == 0) {
        file_list_html = `Empty folder`;
    }

    let main_container = `

        <div class="col-12">
            <div class="list-group">

                ${file_list_html}

            </div>
        </div>

    `;

    if( mode == 'fold_file' ){




        folder_list_html = file_list1.join('');
        //file_list_html = file_list1.join('') + file_list2.join('');
        file_list_html =  file_list2.join('');

        if (files.length == 0) {
            file_list_html = `Empty folder`;
        }


        main_container = `

            <div class="col col-4  d-none d-sm-none d-md-none d-lg-block d-xl-block ">

                <div id="treeview1"></div>

            </div>


            <div class="col col-12 col-sm-12 col-md-12 col-lg-8 col-xl-8  d-block  ">
                <div class="list-group">

                    ${file_list_html}

                </div>
            </div>
        `;
    }


    if( mode == 'fold_thumb' ){

        main_container_class = 'container-fluid';

        folder_list_html = file_list1.join('');
        //file_list_html = file_list1.join('') + file_list2.join('');
        file_list_html =  file_list2.join('');


        main_container = `

            <div class="col-4  d-none d-sm-none d-md-none d-lg-block d-xl-block ">

                <div id="treeview1"></div>

            </div>


            <div class="col-12 col-sm-12 col-md-12 col-lg-8 col-xl-8  d-block  ">




                <div class="content">
                    <div class="container">
                        <div class="row">
                            <div class="col-12">
                                <div class="card-box">



                                    <div class="row">

                                        ${file_list_html_thum}




                                    </div>




                                </div>
                            </div>
                            <!-- end col -->
                        </div>
                        <!-- end row -->
                    </div>
                    <!-- container -->
                </div>



            </div>
        `;
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

        <link href="/__assets/bstreeview.min.css" rel="stylesheet" crossorigin="anonymous">


        <script>

        let config = {
            files_count_max:      ${config.files_count_max},
            fieldSize_max:        ${config.fieldSize_max},
            fieldSize_max_human: '${config.fieldSize_max_human}',
        };

        let file_tree1 = JSON.parse('${file_tree1}');



        </script>

        <link href="/__assets/index.css" rel="stylesheet" crossorigin="anonymous">



    </head>
    <body>


    <br>
    <div class="${main_container_class}">


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

        <div class="row " style="padding:0 0;">

            <div class="col-4" >

            </div>

            <div class="col-8 text-end">




                <div class="btn-group btn-group-sm" role="group" aria-label="">
                    ${ mode == 'fold_thumb' ? '<a  class="btn btn-outline-secondary active" href="?mode=fold_thumb" title="Folder and thumb"><i class="bi bi-image"></i> Folder and thumb</a>' : '<a  class="btn btn-outline-secondary" href="?mode=fold_thumb" title="Folder and thumb"><i class="bi bi-image"></i></a>' }

                    ${ mode == 'fold_file' ? '<a  class="btn btn-outline-secondary active" href="?mode=fold_file" title="Folder and files"><i class="bi bi-folder"></i> Folder and files</a>' : '<a  class="btn btn-outline-secondary" href="?mode=fold_file" title="Folder and files"><i class="bi bi-folder"></i></a>' }

                    ${ mode == 'list' ? '<a  class="btn btn-outline-secondary active" href="?mode=list" title="List layout"><i class="bi bi-list"></i> List layout</a>' : '<a  class="btn btn-outline-secondary " href="?mode=list" title="List layout"><i class="bi bi-list"></i></a>' }


                </div>


            </div>


        </div>


        <div class="row" style="padding:10px 0 100px 0;">

            ${main_container}

        </div>


    </div>






    <script src="https://code.jquery.com/jquery-3.7.0.min.js" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>


    <script src="/__assets/bstreeview.min.js" crossorigin="anonymous"></script>

    <script src="/__assets/index.js" crossorigin="anonymous"></script>


    </body>
    </html>
    `;
};
