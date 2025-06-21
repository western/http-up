import fs from 'fs';
import path from 'node:path';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import * as dateTime from 'node-datetime';
import mime from 'mime';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const get_all = (app, argv) => {
    app.get('*splat', (req, res, next) => {
        let req_path = urlencode.decode(req.path);
        req_path = util.http_path_clear(req_path);

        let readFolder = path.join(argv.fold, req_path);

        if (req_path && req_path == '/favicon.ico') {
            res.status(404).send(JSON.stringify({ code: 404, msg: '404 Not found' }));
            return;
        }

        let is_no_show_log = false;
        if (req_path && req_path.startsWith('/__assets/')) {
            //console.log('change ASSETS path from=', readFolder);

            let cntx_arr = /\/__assets\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readFolder = path.join(util.__dirname, '..', 'assets');
                readFolder += '/' + cntx_arr[1];
                is_no_show_log = true;

                //console.log('change ASSETS path to=', readFolder);
            }
        }
        if (req_path && req_path.startsWith('/__temp/')) {
            //console.log('change TEMP path from=', readFolder);

            let cntx_arr = /\/__temp\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readFolder = config.httpup_temp;
                readFolder += '/' + cntx_arr[1];
                //is_no_show_log = true;

                //console.log('change TEMP path to=', readFolder);
            }
        }

        //res.status(403).send(util.error_page_content('403', 'sfsdfsdfds'));
        //res.status(500).send(util.error_page_content('500', 'dfsfsfdfs'));
        //res.status(404).send(util.error_page_content('404', 'sfsdfdfsfd'));
        //return;

        //console.log('readFolder', readFolder, is_no_show_log);
        //readFolder = '/tmp/archive-20250606-171630.zip'

        const err_code_return = (readFolder, err, is_arr_code) => {
            if (!err) {
                return false;
            }

            for (let a = 0; a < is_arr_code.length; a++) {
                if (err.code == 'ENOENT' && is_arr_code[a] == 'ENOENT') {
                    model.event_log.write(res, req, 404, 'core', 'Not found ' + chalk.yellow(readFolder));
                    res.status(404).send(util.error_page_content('404', 'Not found'));
                    return true;
                }
                if (err.code == 'EACCES' && is_arr_code[a] == 'EACCES') {
                    model.event_log.write(res, req, 403, 'core', 'Forbidden ' + chalk.yellow(readFolder));
                    res.status(403).send(util.error_page_content('403', 'Forbidden'));
                    return true;
                }
                if (err.code == 'ENOTDIR' && is_arr_code[a] == 'ENOTDIR') {
                    model.event_log.write(res, req, 500, 'core', 'Internal Server ' + chalk.yellow(readFolder));
                    res.status(500).send(util.error_page_content('500', 'Internal Server'));
                    return true;
                }
            }

            return false;
        };

        // FS STAT -----------------------------------------------------------------------------------------------------------------------------------
        fs.stat(readFolder, (err, stats) => {
            if (err) {
                const is_problem = err_code_return(readFolder, err, ['ENOENT', 'EACCES']);
                if (is_problem) {
                    return;
                }
            }

            if (stats.isFile()) {
                fs.readFile(readFolder, (err, data) => {
                    if (err) {
                        const is_problem = err_code_return(readFolder, err, ['ENOENT', 'EACCES']);
                        if (is_problem) {
                            return;
                        }

                        model.event_log.write(res, req, 500, 'core', 'Internal Server ' + chalk.yellow(readFolder) + ' fs.readFile_37483 ' + err);
                        res.status(500).send(util.error_page_content('500', 'Internal Server'));
                        return;
                    }

                    const mime_type = mime.getType(readFolder);

                    if (!is_no_show_log) {
                        model.event_log.write(res, req, 200, 'core', 'SendData ' + chalk.yellow(readFolder));
                    }

                    res.status(200).setHeader('content-type', mime_type).send(data);
                    return;
                });

                return;
            }

            if (!stats.isDirectory()) {
                model.event_log.write(res, req, 500, 'core', 'Internal Server ' + chalk.yellow(readFolder) + ' IS NOT DIRECTORY');

                res.status(500).send(util.error_page_content('500', 'Internal Server'));
                return;
            }

            fs.readdir(readFolder, (err, files) => {
                if (err) {
                    const is_problem = err_code_return(readFolder, err, ['ENOENT', 'EACCES', 'ENOTDIR']);
                    if (is_problem) {
                        return;
                    }

                    model.event_log.write(res, req, 500, 'core', 'Internal Server ' + chalk.yellow(readFolder) + ' fs.readdir_BBBBB ' + err);
                    res.status(500).send(util.error_page_content('500', 'Internal Server'));
                    return;
                }

                if (!is_no_show_log) {
                    model.event_log.write(res, req, 200, 'core', 'Dir ' + chalk.yellow(readFolder));
                }

                prepare_main_template(argv, req, res, readFolder, req_path, files);
            });

            return;
        });
        // FS STAT --- END -----------------------------------------------------------------------------------------------------------------------------------
    });
};

const prepare_main_template = async (argv, req, res, readFolder, req_path, files) => {
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

    let folderTree_js = [];
    if (argv['extend-mode']) {
        //folderTree_js = tree_walk(argv, '/', 1);
    }

    //console.log('config 999=', typeof config );
    //console.log('keys=', Object.keys(config['config']));

    res.render('simple', {
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

const generate_file_rows = (argv, req, res, readFolder, req_path, files, sort) => {
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

                    model.file.add2(full_filename);
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
        console.log('generate_file_rows', 'catch err=', err);

        if (err.code == 'EACCES') {
            res.status(403).send(util.error_page_content('403', 'Forbidden'));

            console.log('403 Forbidden', chalk.yellow(readFolder));
        } else {
            res.status(500).send(util.error_page_content('500', 'Internal Server Error'));

            console.log('500 Internal Server Error', chalk.yellow(readFolder));
        }

        return;
    }

    return file_list1.concat(file_list2);
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------

const tree_walk = (argv, fold_name, cnt_deep) => {
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
