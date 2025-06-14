import fs from 'fs';
import path from 'path';
import url from 'url';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_folder = (app, argv) => {
    const upload = multer({
        dest: config.httpup_temp,
        limits: { fieldSize: config.fieldSize_max },
    });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/folder', postProcessing, (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            let clean_folder_name = util.http_path_clear(req.body.name);
            clean_folder_name = clean_folder_name.replace(/\//g, '');

            let full_path = path.join(readFolder, clean_folder_name);

            if (clean_folder_name && clean_folder_name.length > 0 && fs.existsSync(full_path)) {
                model.event_log.write(res, req, 500, 'api/folder', 'Folder ' + chalk.yellow(full_path) + ' already exists');

                res.status(500).json({ code: 500, msg: 'Already exists: ' + clean_folder_name });
                return;
            }

            if (clean_folder_name && clean_folder_name.length > 0 && !fs.existsSync(full_path)) {
                try {
                    fs.mkdirSync(full_path);

                    model.event_log.write(res, req, 200, 'api/folder', 'New folder ' + chalk.green(full_path) + ' created');
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/folder', 'Mkdir error: ', e.toString());

                    res.status(500).json({ code: 500, msg: 'Mkdir error' });
                    return;
                }

                res.status(200).json({ code: 200 });
                return;
            }
        }

        res.status(500).json({ code: 500 });
    });
};
