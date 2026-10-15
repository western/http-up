import fs from 'node:fs/promises';
import path from 'node:path';

import * as urlencode from 'urlencode';
import * as dateTime from 'node-datetime';

import * as model from '../model/index.js';
import * as util from '../lib/util.js';

export const search_result = (app, argv) => {
    app.get('/__search/', async (req, res) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = util.http_path_clear(req_path);

        let readFolder = argv.fold;

        let search_string = req.query.s;
        search_string = urlencode.decode(search_string);

        if (!search_string || search_string.length == 0) {
            res.status(500).send(util.error_page_content('500', 'Search param "s" is empty'));
            return;
        }

        model.event_log.write(res, req, 200, 'search', `Open search result page "${search_string}"`);

        search_process(app, res, req, argv, search_string);
    });
};

const search_process = async (app, res, req, argv, search_string) => {
    if (!search_string || search_string.length == 0) {
        console.log('search_process:', '"s" is required param');
        return;
    }

    //let argv = res.locals.argv;
    //console.log('argv=', argv);

    // -----------------------------------------------------------------------------------

    /*
                        el.full_path = el.full_path.replace(argv.fold, '');
                
                
                        let arr = el.full_path.split('/');
                        arr.shift();
                        arr.pop();
                        
                        el.only_fold = '/'+arr.join('/');
                        
                        const s_regex = new RegExp( s, "i" );
                        
                        el.only_fold_html = el.only_fold;
                        el.only_fold_html = el.only_fold_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
                        
                        el.filename_html = el.filename;
                        el.filename_html = el.filename_html.replace(s_regex, '<span style="background-color:yellow;">'+s+'</span>');
                        
                        el.SizeHuman = util.humanFileSize(el.size);
    */

    let result_arr = [];

    let search_f = async (fold_str) => {
        fs.readdir(fold_str)
            .then((inodes) => {
                for (const dirent of inodes) {
                    const readTarget = path.join(fold_str, dirent);
                    //console.log('readTarget=', readTarget);

                    fs.stat(readTarget)
                        .then((statz) => {
                            //console.log("==", readTarget.replace(argv.fold, ''), "cmp with", search_string);

                            if (readTarget.replace(argv.fold, '').includes(search_string)) {
                                let arr = readTarget.replace(argv.fold, '').split('/');
                                arr.shift();
                                arr.pop();

                                let only_fold = '/' + arr.join('/');

                                const s_regex = new RegExp(search_string, 'i');

                                let filename_html = dirent;
                                filename_html = filename_html.replace(s_regex, '<span style="background-color:yellow;">' + search_string + '</span>');

                                let only_fold_html = only_fold;
                                only_fold_html = only_fold_html.replace(s_regex, '<span style="background-color:yellow;">' + search_string + '</span>');

                                let modtime = dateTime.create(statz.mtime);
                                let mTimeHuman = modtime.format('Y-m-d H:M:S');

                                result_arr.push({
                                    full_path: readTarget.replace(argv.fold, ''),
                                    only_fold: only_fold,
                                    only_fold_html: only_fold_html,
                                    filename_html: filename_html,

                                    SizeHuman: util.humanFileSize(statz.size),
                                    modified: mTimeHuman,
                                    ext: path.parse(readTarget).ext,
                                });
                            }

                            if (statz.isDirectory()) {
                                search_f(readTarget);
                            }
                        })
                        .catch((err) => {
                            //console.log("err=", err)
                        });
                }
            })
            .catch((err) => {});
    };

    search_f(argv.fold).then(() => {
        model.event_log.write(res, req, 200, 'search', `End search for "${search_string}"`);

        app.disable('view cache');
        app.set('view cache', false);

        //console.log('result_arr=', result_arr);

        res.render('search', {
            result_list: result_arr,
        });
    });
};
