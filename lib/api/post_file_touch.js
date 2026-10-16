import fsSync from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import multer from 'multer';
import * as urlencode from 'urlencode';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_file_touch = (app, argv) => {
    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/file/touch', postProcessing, async (req, res) => {
        let referer = util.get_pathname(req.headers.referer);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.name == 'string') {
            let clean_file_name = util.http_path_clear(urlencode.decode(req.body.name));
            clean_file_name = clean_file_name.replace(/\//g, '');

            let full_path = path.join(readFolder, clean_file_name);

            if (clean_file_name && clean_file_name.length > 0 && fsSync.existsSync(full_path)) {
                model.event_log.write(
                    res,
                    req,
                    500,
                    'api/file/touch',
                    'File ' + chalk.green(clean_file_name) + ' for ' + chalk.yellow(readFolder) + ' already exists',
                );

                res.status(500).json({ code: 500, msg: 'Already exists: ' + clean_file_name });
                return;
            }

            if (clean_file_name && clean_file_name.length > 0 && !fsSync.existsSync(full_path)) {
                try {
                    fsSync.closeSync(fsSync.openSync(full_path, 'w'));

                    model.event_log.write(res, req, 200, 'api/file/touch', 'New file ' + chalk.green(full_path) + ' created');
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/file/touch', 'File new error: ', e.toString());

                    res.status(500).json({ code: 500, msg: 'File new error' });
                    return;
                }

                res.status(200).json({ code: 200 });
                return;
            }
        }

        model.event_log.write(res, req, 500, 'api/file/touch', 'Name is required param');
        res.status(500).json({ code: 500, msg: 'Name is required param' });
    });
};
