import fs from 'fs';
import path from 'node:path';
import url from 'url';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_delete = (app, argv) => {
    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/delete', postProcessing, async (req, res) => {
        let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name && readFolder.length > 0) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            let errors = [];

            req.body.name.forEach((el, indx) => {
                let clean_el = util.http_path_clear(el);
                clean_el = clean_el.replace(/\//g, '');

                let target_file_path = path.join(readFolder, clean_el);

                if (!fs.existsSync(target_file_path)) {
                    model.event_log.write(res, req, 404, 'api/delete', 'Not found ' + chalk.yellow(target_file_path));

                    errors.push('Not found: ' + clean_el);
                }

                if (clean_el && clean_el.length > 0 && fs.existsSync(target_file_path)) {
                    try {
                        fs.rmSync(target_file_path, { recursive: true, force: false });

                        model.event_log.write(res, req, 200, 'api/delete', 'Delete ' + chalk.yellow(target_file_path));
                    } catch (e) {
                        model.event_log.write(res, req, 500, 'api/delete', 'Delete error: ', e.toString());

                        errors.push('Delete error: ' + clean_el);
                    }
                } else {
                    errors.push('Problem with: ' + clean_el);
                }
            });

            //model.file().check_exists();

            if (errors.length > 0) {
                res.status(500).json({ code: 500, msg: errors[0] });
                return;
            }

            res.status(200).json({ code: 200 });
            return;
        }

        res.status(500).json({ code: 500 });
    });
};
