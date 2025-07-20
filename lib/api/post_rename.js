import fs from 'fs';
import path from 'node:path';
import url from 'url';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_rename = (app, argv) => {
    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/rename', postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        let to = '';
        if (req.body.to) {
            to = req.body.to;
            to = util.http_path_clear(to);
        }
        if (to.length == 0) {
            res.status(500).json({ code: 500, msg: '"To" param is empty' });
            return;
        }

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            let clean_name = util.http_path_clear(req.body.name);
            clean_name = clean_name.replace(/\//g, '');

            if (clean_name && clean_name.length > 0) {
                let src_file_path = path.join(readFolder, clean_name);
                let target_file_path = path.join(readFolder, to);

                if (!fs.existsSync(src_file_path)) {
                    model.event_log.write(res, req, 404, 'api/rename', 'Not found ' + chalk.yellow(src_file_path));

                    res.status(404).json({ code: 404, msg: 'Not found ' + clean_name });
                    return;
                }

                if (fs.existsSync(target_file_path)) {
                    model.event_log.write(res, req, 500, 'api/rename', 'File/folder ' + target_file_path + ' is exist.');

                    res.status(500).json({ code: 500, msg: 'Target path is exist' });
                    return;
                }

                try {
                    fs.renameSync(src_file_path, target_file_path);
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/rename', 'Rename error: ', e.toString());

                    res.status(500).json({ code: 500, msg: 'Target path is exist' });
                    return;
                }

                //model.file.check_exists();

                model.event_log.write(res, req, 200, 'api/rename', 'Rename ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));

                res.status(200).json({ code: 200 });
                return;
            } else {
                res.status(500).json({ code: 500, msg: 'Target path is exist' });
                return;
            }
        }

        res.status(500).json({ code: 500 });
    });
};
