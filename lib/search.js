import fsSync from 'node:fs';
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

        search_process(app, res, req, search_string);
    });
};

const search_process = async (app, res, req, search_string) => {
    if (!search_string || search_string.length == 0) {
        console.log('search_process:', '"s" is required param');
        return;
    }

    let argv = res.locals.argv;

    // -----------------------------------------------------------------------------------

    let search_f2 = async (fold_path) => {
        let results = [];

        try {
            const entries = await fs.readdir(fold_path, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(fold_path, entry.name);

                if (entry.isDirectory()) {
                    const subDirResults = await search_f2(fullPath);
                    results = results.concat(subDirResults);
                }

                if ((entry.isDirectory() || entry.isFile()) && entry.name.includes(search_string)) {
                    let arr = fullPath.replace(argv.fold, '').split('/');
                    arr.shift();
                    arr.pop();

                    let only_fold = '/' + arr.join('/');

                    const s_regex = new RegExp(search_string, 'i');

                    let filename_html = entry.name;
                    filename_html = filename_html.replace(s_regex, '<span style="background-color:yellow;">' + search_string + '</span>');

                    let only_fold_html = only_fold;
                    only_fold_html = only_fold_html.replace(s_regex, '<span style="background-color:yellow;">' + search_string + '</span>');

                    const statz = fsSync.statSync(fullPath);
                    let modtime = dateTime.create(statz.mtime);
                    let mTimeHuman = modtime.format('Y-m-d H:M:S');

                    results.push({
                        full_path: fullPath.replace(argv.fold, ''),
                        only_fold: only_fold,
                        only_fold_html: only_fold_html,
                        filename_html: filename_html,

                        SizeHuman: util.humanFileSize(statz.size),
                        modified: mTimeHuman,
                        ext: path.parse(fullPath).ext,
                    });
                }
            }
        } catch (err) {
            //console.error(`Error during looking ${fold_path}:`, err.message);
        }

        return results;
    };

    let result_arr = await search_f2(argv.fold);

    model.event_log.write(res, req, 200, 'search', `End search for "${search_string}"`);

    app.disable('view cache');
    app.set('view cache', false);

    res.render('search', {
        result_list: result_arr,
        search_string: search_string,
    });
};
