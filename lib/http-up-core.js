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



            //let body = prepare_main_template(argv, req, res, readFolder, req_path, files);
            
            if( !is_asset ){
                let clp = util.common_log_prefix(req);
                console.log(clp, 'Dir ' + colors.yellow(readFolder));
            }

            //res.send(body);
            
            
            
            
            
            
            
            let mode = 'list'; // thumb, list

            if( util.getcookie(req, 'mode') ){
                mode = util.getcookie(req, 'mode');
            }

            if( req.query.mode ){
                mode = req.query.mode;
            }

            res.cookie('mode', mode);
            
            
            
            
            
            
            
            let arr_path = urlencode.decode(req.path).split(/\//);
            arr_path.shift();

            let breadcrumb_html = '';
            let breadcr = [];
            for (let a = 0; a < arr_path.length; a++) {
                let el = arr_path[a];

                breadcr.push(el);
                breadcrumb_html += `<li class="breadcrumb-item"><a class="nodecor" href="/${breadcr.join('/')}">${el}</a></li>`;
            }
            
            
            let rows = generate_file_rows( req, res, readFolder, req_path, files  );
            
            
            
            
            res.render('index', {
                "breadcrumb": breadcrumb_html,
                
				
				"rows":            rows,
				"arg_extend_mode": argv['extend-mode'],
				"mode_thumb":      mode == "thumb" ? true : false,
				"mode_list":       mode == "list" ? true : false,

				"files_count_max":     20,
				"fieldSize_max":       7 * 1024 * 1024 * 1024,
				"fieldSize_max_human": "7 Gb",

				"arg_upload_disable":      argv['upload-disable'],
				"arg_folder_make_disable": argv['folder-make-disable'],
				
				"config": config,
            });
            
        });
    });
    // END app.get
};


let generate_file_rows = (req, res, readFolder, req_path, files) => {
    
    
    

    let file_list1 = [];
    let file_list2 = [];
    

    

    try {
        files.forEach((file) => {

            let stats = fs.lstatSync( path.join(readFolder, file) );
            
            let fileSizeInBytes = stats.size;
            let fileSizeInHuman = util.humanFileSize(stats.size);
            
            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');
            
            
            
            let ext = path.parse(file).ext;
            ext = ext.replace(/\./g, '');
		    ext = ext.toLowerCase();
            
            
            
            let is_preview_match = ext.match(/(jpg|jpeg|png|gif)/i);


            if (stats.isDirectory()) {
                
                file_list1.push({
                    IsDir:        stats.isDirectory(),
					FullPath:     path.join(req_path, file),
					Name:         file,
					SizeHuman:    fileSizeInHuman,
					ModTimeHuman: modtime_human,
					IsPreview:    false,
                });

            } else {
                
                
                file_list2.push({
                    IsDir:        stats.isDirectory(),
					FullPath:     path.join(req_path, file),
					Name:         file,
					SizeHuman:    fileSizeInHuman,
					ModTimeHuman: modtime_human,
					IsPreview:    is_preview_match,
                });

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



    return file_list1.concat( file_list2 );
}






// -------------------------------------------------------------------------------------------------------------------------------------------------------








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







