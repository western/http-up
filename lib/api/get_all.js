import fs from 'node:fs/promises';
import path from 'node:path';
import * as urlencode from 'urlencode';
import chalk from 'chalk';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';
import { TFile } from '../file.js';

export const get_all = (app, argv) => {
    const handleError = (err, res, req, tag) => {
        if (err && err.code && err.code == 'ENOENT') {
            let req_path = res.locals.req_path;

            model.event_log.write(res, req, 404, tag, 'Not found ' + chalk.yellow(req_path));
            res.status(404).send(util.error_page_content('404', 'Not found'));
            return;
        }

        if (err && err.code && err.code == 'EACCES') {
            let req_path = res.locals.req_path;

            model.event_log.write(res, req, 403, tag, 'Forbidden ' + chalk.yellow(req_path));
            res.status(403).send(util.error_page_content('403', 'Forbidden'));
            return;
        }

        const msg = err.message || 'Unknown error';

        model.event_log.write(res, req, 500, tag, msg);

        res.status(500).json({
            code: 500,
            msg: 'Internal Server Error',
        });
    };

    const first_url = async (req, res, next) => {
        let req_path = util.http_path_clear(req.path);
        let readTarget = path.join(argv.fold, req_path);
        //console.log(req_path, 'first_url run');

        if (req_path && req_path.startsWith('/favicon.ico')) {
            res.status(404).send(JSON.stringify({}));
            return;
        }

        let is_no_show_log = false;
        if (req_path && req_path.startsWith('/__assets/')) {
            let cntx_arr = /\/__assets\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readTarget = path.join(util.__dirname, '..', 'assets');
                readTarget += '/' + cntx_arr[1];
                is_no_show_log = true;
            }
        }
        if (req_path && req_path.startsWith('/__temp/')) {
            let cntx_arr = /\/__temp\/(.+)$/.exec(req_path);
            if (cntx_arr) {
                readTarget = config.httpup_temp;
                readTarget += '/' + cntx_arr[1];
                //is_no_show_log = true;
            }
        }

        res.locals.argv = argv;
        res.locals.req_path = req_path;
        res.locals.readTarget = readTarget;
        res.locals.is_no_show_log = is_no_show_log;

        next();
    };

    const second_stat = async (req, res, next) => {
        //console.log(res.locals.req_path, 'second_stat run');

        let readTarget = res.locals.readTarget;

        fs.stat(readTarget)
            .then((st) => {
                res.locals.stats = st;
                next();
            })
            .catch((err) => {
                handleError(err, res, req, 'core/2');
            });
    };

    const third_file = async (req, res, next) => {
        //console.log(res.locals.req_path, 'third_file run');

        let argv = res.locals.argv;
        let readTarget = res.locals.readTarget;
        let is_no_show_log = res.locals.is_no_show_log;

        if (!res.locals.stats.isFile() && !res.locals.stats.isDirectory()) {
            model.event_log.write(
                res,
                req,
                500,
                'core/3',
                'Internal Server Error ' + chalk.yellow(readTarget) + ' IS NOT [Regular file] and IS NOT [Directory]',
            );

            res.status(500).send(util.error_page_content('500', 'Internal Server'));
            return;
        }

        if (res.locals.stats.isFile()) {
            let file_obj = new TFile(readTarget);

            file_obj
                .returnFile(res)
                .then(() => {
                    if (!is_no_show_log) {
                        model.event_log.write(res, req, 200, 'core/3', 'sendFile ' + chalk.yellow(readTarget));
                    }
                })
                .catch((err) => {
                    handleError(err, res, req, 'core/3');
                });
        } else {
            next();
        }
    };

    const fourth_directory = async (req, res, next) => {
        //console.log(res.locals.req_path, 'fourth_directory run');

        let argv = res.locals.argv;
        let readTarget = res.locals.readTarget;
        let req_path = res.locals.req_path;
        let is_no_show_log = res.locals.is_no_show_log;

        let index_file_path = path.join(readTarget, 'index.html');
        let index_file_obj = new TFile(index_file_path);

        if (index_file_obj.exists) {
            model.event_log.write(res, req, 200, 'core/4', 'Index.html found, send ' + chalk.yellow(index_file_path));

            index_file_obj
                .returnFile(res)
                .then(() => {})
                .catch((err) => {
                    handleError(err, res, req, 'core/4');
                });

            return;
        }

        fs.readdir(readTarget)
            .then((files) => {
                if (!is_no_show_log) {
                    model.event_log.write(res, req, 200, 'core/4', 'Dir ' + chalk.yellow(readTarget));
                }

                prepare_main_template(argv, req, res, readTarget, req_path, files);
            })
            .catch((err) => {
                handleError(err, res, req, 'core/4');
            });
    };

    app.get('*splat', first_url, second_stat, third_file, fourth_directory);
};

const prepare_main_template = async (argv, req, res, readTarget, req_path, files) => {
    // -----------------------------------------------------------------------------------------

    let prm_mode = 'list'; // thumb, list

    if (util.getcookie(req, 'mode')) {
        prm_mode = util.getcookie(req, 'mode');
    }

    if (req.query.mode) {
        prm_mode = req.query.mode;
    }
    res.cookie('mode', prm_mode);

    // -----------------------------------------------------------------------------------------

    let prm_sort = 'name'; // name, modified, size

    if (util.getcookie(req, 'sort')) {
        prm_sort = util.getcookie(req, 'sort');
    }

    if (req.query.sort) {
        prm_sort = req.query.sort;
    }
    res.cookie('sort', prm_sort);

    // -----------------------------------------------------------------------------------------

    let arr_path = urlencode.decode(req.path).split(/\//);
    arr_path.shift();

    let breadcrumb_html = '';
    let breadcr = [];
    for (let a = 0; a < arr_path.length; a++) {
        let el = arr_path[a];

        breadcr.push(el);
        breadcrumb_html += `<li class="breadcrumb-item"><a class="nodecor" href="/${breadcr.join('/')}">${el}</a></li>`;
    }

    // -----------------------------------------------------------------------------------------

    let rows = generate_file_rows(readTarget, req_path, files, prm_sort);

    if (argv['extend-mode']) {
        let full_filename_arr = [];
        for (let a = 0; a < rows.length; a++) {
            if (rows[a].isFile) {
                full_filename_arr.push(rows[a].fullPath);
            }
        }

        model.file.add(res, full_filename_arr);
    }

    res.render('index', {
        breadcrumb: breadcrumb_html,

        rows: rows,
        arg_extend_mode: argv['extend-mode'],
        mode_thumb: prm_mode == 'thumb' ? true : false,
        mode_list: prm_mode == 'list' ? true : false,

        sort_name: prm_sort == 'name' ? true : false,
        sort_modified: prm_sort == 'modified' ? true : false,
        sort_size: prm_sort == 'size' ? true : false,

        arg_upload_disable: argv['upload-disable'],
        arg_folder_make_disable: argv['folder-make-disable'],
        arg_usedb: argv['usedb'],

        config: config,
    });
};

const generate_file_rows = (readTarget, req_path, files, prm_sort) => {
    let file_list1 = [];
    let file_list2 = [];

    //try {
    files.forEach((filename) => {
        let fl = new TFile(path.join(readTarget, filename));

        let relativePath = path.join(req_path, filename);
        let rnds = util.random_ansi_string(2);
        let relativePathPreview = path.join('/__thumb/', req_path, filename);

        fl.relativePath = relativePath;
        fl.rnds = rnds;
        fl.relativePathPreview = relativePathPreview;

        if (fl.isDirectory) {
            file_list1.push(fl);
        } else {
            file_list2.push(fl);
        }
    });

    if (prm_sort == 'name') {
        file_list1 = file_list1.sort((a, b) => a.fileName - b.fileName);
        file_list2 = file_list2.sort((a, b) => a.fileName - b.fileName);
    }

    if (prm_sort == 'modified') {
        file_list1 = file_list1.sort((a, b) => a.mTime - b.mTime);
        file_list2 = file_list2.sort((a, b) => a.mTime - b.mTime);
    }

    if (prm_sort == 'size') {
        file_list1 = file_list1.sort((a, b) => a.size - b.size);
        file_list2 = file_list2.sort((a, b) => a.size - b.size);
    }
    //} catch (err) {}

    return file_list1.concat(file_list2);
};
