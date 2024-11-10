'use strict';

const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const colors = require('colors');
const dateTime = require('node-datetime');

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

        




        fs.readdir(readFolder, (err, files) => {


            



            if (err && err.code == 'ENOTDIR') {
                
                
                res.sendFile( readFolder );
                

                if( !is_asset ){
                    let clp = util.common_log_prefix(req);
                    
                    
                    
                    console.log(clp, 'SendFile ' + colors.yellow(readFolder));
                    
                }

                return;
            }

            if (err && err.code == 'ENOENT') {
                res.status(404).send(util.error_page_content('404', '404 Not found'));

                let clp = util.common_log_prefix(req);
                console.log(clp, '404 Not found', colors.yellow(readFolder));

                return;
            }



            let body = prepare_main_template(argv, req, res, readFolder, req_path, files);
            
            if( !is_asset ){
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Dir ' + colors.yellow(readFolder));
            }

            res.send(body);
        });
    });
    // END app.get
};

let prepare_main_template = (argv, req, res, readFolder, req_path, files) => {
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





    let mode = 'list'; // thumb, list


    if( util.getcookie(req, 'mode') ){
        mode = util.getcookie(req, 'mode');
    }

    if( req.query.mode ){
        mode = req.query.mode;
    }

    res.cookie('mode', mode);
    




    

    


    // -------------------------------------------------------------------------------------------------------------------------------------------------------------

    let main_container_class = 'container';
    let main_container = '';
    

    if (argv['extend-mode']) {
        
        if ( mode == 'list' ) {
            [main_container_class, main_container] = generate_file_table( req, res, readFolder, req_path, files )
        }
        
        
        if ( mode == 'thumb' ) {
            [main_container_class, main_container] = generate_file_thumb( req, res, readFolder, req_path, files )
        }
        
    }else{
        
        
        [main_container_class, main_container] = generate_file_list( req, res, readFolder, req_path, files )
        
    }
    


    // -------------------------------------------------------------------------------------------------------------------------------------------------------------



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










let generate_file_list = ( req, res, readFolder, req_path, files ) => {
    
    
    

    let file_list1 = [];
    let file_list2 = [];
    

    

    try {
        files.forEach((file) => {

            let stats = fs.lstatSync( path.join(readFolder, file) );
            
            let fileSizeInBytes = stats.size;
            let fileSizeInHuman = util.humanFileSize(stats.size);
            
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');


            if (stats.isDirectory()) {
                file_list1.push(`
                    <!--a href="${req_path}${file}" class="list-group-item list-group-item-action folder"><i class="bi bi-folder"></i> ${file}</a-->
                    
                    <a href="` + path.join(req_path, file) + `" class="list-group-item list-group-item-action fold">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1"><i class="bi bi-folder"></i> ` + file + `</h5>
                            <!--small class="text-muted">` + fileSizeInHuman + ` </small-->
                        </div>
                    </a>
                    
                `);

                

            } else {
                file_list2.push(`
                    <!--a  href="${req_path}${file}" class="list-group-item list-group-item-action file"><i class="bi bi-file-earmark"></i> ${file}</a-->
                    
                    <a href="` + path.join(req_path, file) + `" class="list-group-item list-group-item-action file">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1"><i class="bi bi-file-earmark"></i> ` + file + `</h6>
                            <small class="text-muted">` + fileSizeInHuman + ` </small>
                        </div>
                        <!--p class="mb-1">Some placeholder content in a paragraph.</p-->
                        <small class="text-muted">` + modtime_human + `</small>
                    </a>
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










    
    let file_list_html = '';
    
    let main_container_class = 'container';


    
    file_list_html = file_list1.join('') + file_list2.join('');
    

    if (files.length == 0) {
        file_list_html = `Empty folder`;
    }

    
    
    
    let main_container = `

        <div class="container">
            
            
            
            
            <div class="row ">
                
                
                <div class='list-group'>
                
                ` + file_list_html + `
            
                
                </div>
                
            </div>
        </div>
        
        
        
    `;

    


    
    
    return [main_container_class, main_container];
    
};










let generate_file_table = ( req, res, readFolder, req_path, files ) => {
    
    
    

    let file_list1 = [];
    let file_list2 = [];
    

    

    try {
        files.forEach((file) => {

            let stats = fs.lstatSync( path.join(readFolder, file) );
            
            let fileSizeInBytes = stats.size;
            let fileSizeInHuman = util.humanFileSize(stats.size);
            
            
            
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');


            if (stats.isDirectory()) {
                file_list1.push(`
                    <!--a href="${req_path}${file}" class="list-group-item list-group-item-action folder"><i class="bi bi-folder"></i> ${file}</a-->
                    
                    <tr>
                      <th scope="row" class="text-center"><input class="form-check-input" type="checkbox" name="fold" value="` + file + `" ></th>
                      <td ><i class="bi bi-folder"></i> <a class="nodecor" href="` + path.join(req_path, file) + `">` + file + `</a></td>
                      
                      <td class="d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell"></td>
                      <td class="d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell"></td>
                      <td class="text-center">
                        <a class="del" href="javascript:void(0)" data-name="` + file + `"><i class="bi bi-x-lg"></i></a>
                      </td>
                    </tr>
                    
                `);

                

            } else {
                file_list2.push(`
                    <!--a  href="${req_path}${file}" class="list-group-item list-group-item-action file"><i class="bi bi-file-earmark"></i> ${file}</a-->
                    
                    <tr>
                      <th scope="row" class="text-center"><input class="form-check-input" type="checkbox" name="file" value="` + file + `" ></th>
                      <td ><a class="nodecor" href="` + path.join(req_path, file) + `">` + file + `</a></td>
                      
                      <td class="d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell">` + fileSizeInHuman + `</td>
                      <td class="d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell">` + modtime_human + `</td>
                      <td class="text-center">
                        <a class="del" href="javascript:void(0)" data-name="` + file + `"><i class="bi bi-x-lg"></i></a>
                      </td>
                    </tr>
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










    
    let file_list_html = '';
    
    let main_container_class = 'container';


    
    file_list_html = file_list1.join('') + file_list2.join('');
    

    if (files.length == 0) {
        file_list_html = `<tr><td colspan="5">Empty folder</td></tr>`;
    }

    
    
    
    let main_container = `
        
        
        <div class="container">
	    
	    
	        <div class="row " style="padding:10px 0;">

                <div class="col-4" >

                </div>

                <div class="col-8 text-end">
                    
                    <div class="btn-group btn-group-sm" role="group" aria-label="">
                        <a  class="btn btn-outline-secondary " href="?mode=thumb" title="Folder and thumb"><i class="bi bi-image"></i> Thumbnails</a>
                        <a  class="btn btn-outline-secondary active" href="?mode=list" title="List layout"><i class="bi bi-list"></i> List layout</a>
                    </div>
                    
                </div>
                
            </div>
	    
	    
            <table class="table file-table table-hover ">
              <thead>
                <tr>
                  <th class="text-center"><input class="form-check-input head-chk" type="checkbox" value="" ></th>
                  <th >name</th>
                  
                  <th class="col d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell"></th>
                  <th class="col d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell"></th>
                  <th class="text-center">del</th>
                </tr>
              </thead>
              <tbody>
              
                ` + file_list_html + `
                
               
                
                
              </tbody>
            </table>
            
            <div class="row " >
                <div  class="d-grid gap-2 d-md-block">
                    <button type="button" class="btn btn-outline-danger btn-sm" id="group_del">Delete group</button>
                    
                </div>
            </div>
            
        </div>
        
        
        
        
        
        
        
        
    `;

    


    
    
    return [main_container_class, main_container];
    
};












let generate_file_thumb = ( req, res, readFolder, req_path, files ) => {
    
    
    

    let file_list1 = [];
    let file_list2 = [];

    

    try {
        files.forEach((file) => {

            let stats = fs.lstatSync( path.join(readFolder, file) );
            
            let fileSizeInBytes = stats.size;
            let fileSizeInHuman = util.humanFileSize(stats.size);
            
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');


            if (stats.isDirectory()) {
                file_list1.push(`
                    <!--
                    <a href="${req_path}${file}" class="list-group-item list-group-item-action folder"><i class="bi bi-folder"></i> ${file}</a>
                    -->
                    
                    
                    <div class="col">
                        <div class="card shadow-sm">
                            <a href="` + path.join(req_path, file) + `">
                            <svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img"  preserveAspectRatio="xMidYMid slice" focusable="false">
                                <title></title>
                                <rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">Folder</text>
                            </svg>
                            </a>
                            <div class="card-body">
                                <p class="card-text text-truncate">
                                    <b>` + file + `</b><br>
                                    <span class="fw-lighter">` + modtime_human + `</span>
                                </p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        
                                        <div class="input-group-text">
                                            <input class="form-check-input mt-0" type="checkbox" name="fold" value="` + file + `" >
                                        </div>
                                        
                                        
                                        <!--a type="button" class="btn btn-sm btn-outline-secondary" href="` + path.join(req_path, file) + `">View</a-->
                                        <!--a type="button" class="btn btn-sm btn-outline-danger">Del</a-->
                                    </div>
                                    <small class="text-body-secondary">
                                        <div class="btn-group">
                                            
                                            <a type="button" class="del btn btn-sm btn-outline-danger" href="javascript:void(0)" data-name="` + file + `" ><i class="bi bi-x-lg"></i></a>
                                            
                                            
                                            
                                        </div>
                                        
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    
                `);

                

            } else {
                


                let ext = path.parse(file).ext;
                ext = ext.replace(/\./g, '');

                /*
                let img_preview = `/__assets/document-128.png`;
                if( ext == 'jpg' ){
                    img_preview = `${req_path}${file}`;
                }*/
                
                /*
                ext := filepath.Ext(e.Name())
				ext = strings.ToLower(ext)
				ext = strings.Replace(ext, ".", "", -1)
				*/

				//fmt.Println("ext="+ext)

				let img_preview = `
		            <svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img"  preserveAspectRatio="xMidYMid slice" focusable="false">
                        <title></title>
                        <rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">File</text>
                    </svg>
				`

				
				//is_match, _ := regexp.MatchString("^(jpg|jpeg|png|gif)$", ext)
				let is_match = ext.match(/(jpg|jpeg|png|gif)/i);

				
				if (is_match) {

					

					img_preview = `
    		            <div class="bd-placeholder-img card-img-top" width="100%" height="225" style="height:225px; background: no-repeat center/80% url('` + path.join(req_path, file) + `'); background-size: cover;  " >
    		            </div>
    				`

				}


                file_list2.push(`
                    <!--
                    <a  href="${req_path}${file}" class="list-group-item list-group-item-action file"><i class="bi bi-file-earmark"></i> ${file}</a>
                    -->
                    
                    
                    <div class="col">
                        <div class="card shadow-sm">
                            <a href="` + path.join(req_path, file) + `">
                                ` + img_preview + `
                            </a>
                            <div class="card-body">
                                <p class="card-text text-truncate" >
                                    <b>` + file + `</b><br>
                                    <span class="fw-lighter">` + modtime_human + `</span>
                                </p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        
                                        
                                        <div class="input-group-text">
                                            <input class="form-check-input mt-0" type="checkbox" name="file" value="` + file + `" >
                                        </div>
                                        
                                        
                                        
                                        
                                        
                                    </div>
                                    <small class="text-body-secondary">
                                        <div class="btn-group">
                                            <div class="input-group-text font-reset" >
                                                ` + fileSizeInHuman + `
                                            </div>
                                            
                                            
                                            
                                            <a type="button" class="del btn btn-sm btn-outline-danger" href="javascript:void(0)" data-name="` + file + `" ><i class="bi bi-x-lg"></i></a>
                                            
                                        </div>
                                    </small>
                                </div>
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










    
    
    
    let main_container_class = 'container';
    //main_container_class = 'container-fluid';


    
    let file_list_html = file_list1.join('') + file_list2.join('');
    

    if (files.length == 0) {
        file_list_html = `Empty folder`;
    }

    

    

    


    let main_container = `

        <div class="container">
            
            <div class="row " style="padding:0 0 20px 0;">

                <div class="col-4" >
                    
                    <div class="btn-group">
                        
                        
                        <div class="input-group-text">
                            <input class="form-check-input mt-0 head-chk" type="checkbox"  >
                        </div>
                        
                    </div>
                    
                    
                    
                </div>

                <div class="col-8 text-end">
                    
                    <div class="btn-group btn-group-sm" role="group" aria-label="">
                        <a  class="btn btn-outline-secondary active" href="?mode=thumb" title="Folder and thumb"><i class="bi bi-image"></i> Thumbnails</a>
                        <a  class="btn btn-outline-secondary " href="?mode=list" title="List layout"><i class="bi bi-list"></i> List layout</a>
                    </div>
                    
                </div>
                
            </div>
            
            
            <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                
                <!--
                <div class="col">
                    <div class="card shadow-sm">
                        <svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false">
                            <title>Placeholder</title>
                            <rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">Thumbnail</text>
                        </svg>
                        <div class="card-body">
                            <p class="card-text">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary">View</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary">Edit</button>
                                </div>
                                <small class="text-body-secondary">9 mins</small>
                            </div>
                        </div>
                    </div>
                </div>
                -->
                
                ` + file_list_html + `
            
                

                
            </div>
            
            
            
            <div class="row " >
                <div class="d-grid gap-2 d-md-block" style="padding: 50px 0;">
                    <button type="button" class="btn btn-outline-danger btn-sm" id="group_del">Delete group</button>
                    
                </div>
            </div>
            
            
            
        </div>
        
        
        
    `;

    
    return [main_container_class, main_container];
    
};







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







