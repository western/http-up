'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const chalk = require('chalk');
const dateTime = require('node-datetime');
const mime = require('mime');
const exec = require('child_process').exec;

const config = require('./config');
const util = require('./util');
const model = require(path.join(__dirname, '..', 'model', 'index'));

const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');

exports.api_core = (app, argv) => {
    app.get('*', async (req, res) => {
        
        

        let req_path = urlencode.decode(req.path);
        req_path = util.http_path_clear(req_path);

        let readFolder = path.join(argv.fold, req_path);

        if (req_path && req_path == '/favicon.ico') {
            res.status(404).send(JSON.stringify({ code: 404, msg: '404 Not found' }));
            return;
        }

        let is_no_show_log = false;
        if (req_path && req_path.startsWith('/__assets/')) {
            let cntx_arr = /\/__assets\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readFolder = path.join(__dirname, '..', 'assets');
                readFolder += '/' + cntx_arr[1];
                is_no_show_log = true;
            }
        }
        if (req_path && req_path.startsWith('/__temp/')) {
            let cntx_arr = /\/__temp\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readFolder = httpup_temp;
                readFolder += '/' + cntx_arr[1];
                //is_no_show_log = true;
            }
        }

        //console.log('CORE readFolder=', readFolder);

        fs.readdir(readFolder, (err, files) => {
            if (err && err.code == 'ENOTDIR') {
                let code = util.getcookie(req, 'code');
                if (req.query.code) {
                    code = req.query.code;
                }

                let is_ext_crypt = readFolder.match(/(crypt)$/i);

                if (is_ext_crypt && code && code.length > 0) {
                    let temp_file = path.join(httpup_temp, util.random_ansi_string(5));
                    //console.log('temp_file=', temp_file);

                    fs.cpSync(readFolder, temp_file, { recursive: false }, () => {});

                    util.DecryptFile(temp_file, code);

                    let readFolder2 = readFolder;
                    readFolder2 = readFolder2.replace(/\.crypt$/, '');

                    let name = util.get_name(readFolder2);
                    let ext = util.get_ext_norm(readFolder2);

                    

                    res.attachment(name + '.' + ext);

                    res.setHeader('Content-Type', mime.getType(ext));
                    res.sendFile(temp_file);

                    return;
                } else {
                    res.sendFile(readFolder);
                }

                if (!is_no_show_log) {
                    
                    //let clp = util.common_log_prefix(req, res, 200, 'sendfile', readFolder);
                    //console.log(clp, 'SendFile ' + chalk.yellow(readFolder));
                    
                    model.event_log().write( req, 200, 'core', 'SendFile ' + chalk.yellow(readFolder) );
                }

                return;
            }

            if (err && err.code == 'ENOENT') {
                res.status(404).send(util.error_page_content('404', '404 Not found'));

                //let clp = util.common_log_prefix(req, res, 404, 'err', readFolder);
                //console.log(clp, '404 Not found', chalk.yellow(readFolder));
                
                model.event_log().write( req, 404, 'core', '404 Not found ' + chalk.yellow(readFolder) );

                return;
            }

            if (fs.existsSync(path.join(readFolder, 'index.html'))) {
                res.sendFile(path.join(readFolder, 'index.html'));

                //let clp = util.common_log_prefix(req, res, 200, 'sendfile', 'Index.html found. Sendfile '+readFolder);
                //console.log(clp, 'Index.html found. Sendfile ' + chalk.yellow(readFolder));
                
                model.event_log().write( req, 200, 'core', 'Index.html found. Sendfile ' + chalk.yellow(readFolder) );

                return;
            }

            if (!is_no_show_log) {
                
                //let clp = util.common_log_prefix(req, res, 200, 'dir', readFolder);
                //console.log(clp, 'Dir ' + chalk.yellow(readFolder));
                
                model.event_log().write( req, 200, 'core', 'Dir ' + chalk.yellow(readFolder) );
            }

            prepare_main_template(argv, req, res, readFolder, req_path, files);
        });
    });
    // END app.get
};

let prepare_main_template = (argv, req, res, readFolder, req_path, files) => {
    let mode = 'list'; // thumb, list

    if (util.getcookie(req, 'mode')) {
        mode = util.getcookie(req, 'mode');
    }

    if (req.query.mode) {
        mode = req.query.mode;
    }
    res.cookie('mode', mode);

    let sort = 'name'; // name, modified, size

    if (util.getcookie(req, 'sort')) {
        sort = util.getcookie(req, 'sort');
    }

    if (req.query.sort) {
        sort = req.query.sort;
    }
    res.cookie('sort', sort);

    let arr_path = urlencode.decode(req.path).split(/\//);
    arr_path.shift();

    let breadcrumb_html = '';
    let breadcr = [];
    for (let a = 0; a < arr_path.length; a++) {
        let el = arr_path[a];

        breadcr.push(el);
        breadcrumb_html += `<li class="breadcrumb-item"><a class="nodecor" href="/${breadcr.join('/')}">${el}</a></li>`;
    }

    let rows = generate_file_rows(argv, req, res, readFolder, req_path, files, sort);

    let folderTree_js = tree_walk(argv, '/', 1);

    res.render('index', {
        
        breadcrumb: breadcrumb_html,

        rows: rows,
        arg_extend_mode: argv['extend-mode'],
        mode_thumb: mode == 'thumb' ? true : false,
        mode_list: mode == 'list' ? true : false,

        sort_name: sort == 'name' ? true : false,
        sort_modified: sort == 'modified' ? true : false,
        sort_size: sort == 'size' ? true : false,

        folderTree_js: JSON.stringify(folderTree_js),

        arg_crypt: argv.crypt,

        //files_count_max: 20,
        //fieldSize_max: 7 * 1024 * 1024 * 1024,
        //fieldSize_max_human: '7 Gb',

        arg_upload_disable: argv['upload-disable'],
        arg_folder_make_disable: argv['folder-make-disable'],

        config: config,
    });
};

let generate_file_rows = (argv, req, res, readFolder, req_path, files, sort) => {
    let file_list1 = [];
    let file_list2 = [];

    try {
        files.forEach((filename) => {
            let stats = fs.lstatSync(path.join(readFolder, filename));

            let fileSizeInBytes = stats.size;
            let fileSizeInHuman = util.humanFileSize(stats.size);

            let modtime = dateTime.create(stats.mtime);
            let modtime_human = modtime.format('Y-m-d H:M:S');

            let ext = path.parse(filename).ext;
            ext = ext.replace(/\./g, '');
            ext = ext.toLowerCase();

            let is_preview_img = ext.match(/^(jpg|jpeg|png|gif)$/i);
            let is_preview_doc = ext.match(/^(txt|pdf|rtf|doc|docx|xls|xlsx|odt|ods)$/i);
            
            let is_edit_doc = ext.match(/^(html|rtf|doc|docx|odt)$/i);
            let is_edit_code = ext.match(/^(html|txt|js|css|md)$/i);
            
            let full_path = path.join(req_path, filename);

            if (stats.isDirectory()) {
                file_list1.push({
                    IsDir: stats.isDirectory(),
                    FullPath: full_path,
                    FullPathPreview: path.join('/__thumb/', req_path, filename),
                    Name: filename,

                    Size: stats.size,
                    SizeHuman: fileSizeInHuman,

                    ModTime: stats.mtime,
                    ModTimeHuman: modtime_human,

                    IsPreviewImg: false,
                    IsPreviewDoc: false,
                    IsEditDoc: false,
                    IsEditCode: false,

                    Rnds: util.random_ansi_string(2),
                });
            } else {
                file_list2.push({
                    IsDir: stats.isDirectory(),
                    FullPath: full_path,
                    FullPathPreview: path.join('/__thumb/', req_path, filename),
                    Name: filename,

                    Size: stats.size,
                    SizeHuman: fileSizeInHuman,

                    ModTime: stats.mtime,
                    ModTimeHuman: modtime_human,

                    IsPreviewImg: is_preview_img,
                    IsPreviewDoc: is_preview_doc,
                    IsEditDoc: is_edit_doc,
                    IsEditCode: is_edit_code,

                    Rnds: util.random_ansi_string(2),
                });
                
                
                
                if (argv['extend-mode']) {
                    
                    let full_filename = path.join(readFolder, filename);
                    
                    model.file().add2(full_filename);
                    
                    
                }
                
            }
            
            
        });

        if (sort == 'name') {
            file_list1 = file_list1.sort((a, b) => a.Name - b.Name);
            file_list2 = file_list2.sort((a, b) => a.Name - b.Name);
        }

        if (sort == 'modified') {
            file_list1 = file_list1.sort((a, b) => a.ModTime - b.ModTime);
            file_list2 = file_list2.sort((a, b) => a.ModTime - b.ModTime);
        }

        if (sort == 'size') {
            file_list1 = file_list1.sort((a, b) => a.Size - b.Size);
            file_list2 = file_list2.sort((a, b) => a.Size - b.Size);
        }
    } catch (err) {
        let clp = util.common_log_prefix(req);

        console.log('err inside files=', err);

        if (err.code == 'EACCES') {
            res.status(403).send(util.error_page_content('403', '403 Forbidden'));
            console.log(clp, '403 Forbidden', chalk.yellow(readFolder));
        } else {
            res.status(500).send(util.error_page_content('500', '500 Internal Server Error'));
            console.log(clp, '500 Internal Server Error', chalk.yellow(readFolder));
        }

        return;
    }

    return file_list1.concat(file_list2);
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------

let tree_walk = (argv, fold_name, cnt_deep) => {
    if (cnt_deep > 3) {
        return;
    }

    let readFolder2 = path.join(argv.fold, fold_name);
    readFolder2 = util.http_path_clear(readFolder2);

    let nodes = [];

    try {
        let files2 = fs.readdirSync(readFolder2);

        if (files2) {
            try {
                files2.forEach((filename2) => {
                    let stats = fs.lstatSync(path.join(readFolder2, filename2));
                    let nodes_;

                    if (stats.isDirectory()) {
                        nodes_ = tree_walk(argv, path.join(fold_name, filename2), cnt_deep + 1);

                        let nd = {
                            text: filename2,
                            _href: path.join(fold_name, filename2),
                            path: path.join(fold_name, filename2),
                            icon: 'bi bi-folder',
                            expanded: true,
                            nodes: nodes_,
                        };
                        nodes.push(nd);
                    }
                });
            } catch (err3) {}
        }
    } catch (err4) {}

    return nodes;
};
