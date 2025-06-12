import fs from 'fs';
import path from 'path';
import url from 'url';
import * as urlencode from 'urlencode';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_copy = (app, argv) => {
    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([{ name: 'name', maxCount: 1 }]);

    app.post('/api/copy', postProcessing, async (req, res) => {
        //let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        //referer = util.http_path_clear(referer);
        //let readFolder = path.join(argv.fold, referer);

        let from_path = '';
        if (req.body.from_path) {
            from_path = req.body.from_path;
            from_path = util.http_path_clear(from_path);
        }
        if (from_path.length == 0) {
            model.event_log.write(res, req, 500, 'api/copy', '"from_path" param is empty');

            res.status(500).json({ code: 500, msg: '"from_path" param is empty' });
            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------------

        let to_path = '';
        if (req.body.to_path) {
            to_path = req.body.to_path;
            to_path = util.http_path_clear(to_path);
        }
        if (to_path.length == 0) {
            model.event_log.write(res, req, 500, 'api/copy', '"to_path" param is empty');

            res.status(500).json({ code: 500, msg: '"to_path" param is empty' });
            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------------

        console.log('—'.repeat(process.stdout.columns));

        if (req.body.name) {
            if (!Array.isArray(req.body.name)) {
                req.body.name = [req.body.name];
            }

            if (from_path == to_path) {
                model.event_log.write(res, req, 500, 'api/copy', 'Source and Target folders are equal');

                res.status(500).json({ code: 500, msg: 'Source and Target folders are equal' });
                return;
            }

            let errors = [];

            for (let a = 0; a < req.body.name.length; a++) {
                let clean_el = util.http_path_clear(req.body.name[a]);
                clean_el = clean_el.replace(/\//g, '');

                if (clean_el && clean_el.length > 0) {
                    let src_file_path = path.join(argv.fold, from_path, clean_el);
                    let target_file_path = path.join(argv.fold, to_path, clean_el);

                    if (!fs.existsSync(src_file_path)) {
                        model.event_log.write(res, req, 404, 'api/copy', 'Not found ' + chalk.yellow(src_file_path));

                        errors.push('Not found: ' + path.join(clean_el));
                    }

                    if (fs.existsSync(target_file_path)) {
                        try {
                            fs.rmSync(target_file_path, { recursive: true, force: false });

                            model.event_log.write(res, req, 200, 'api/copy', 'File/folder ' + target_file_path + ' is exist. It will be replace.');
                        } catch (e) {
                            model.event_log.write(res, req, 500, 'api/copy', 'Delete error: ', e.toString());

                            errors.push('Delete error: ' + path.join(to, clean_el));
                        }
                    }

                    try {
                        fs.cpSync(src_file_path, target_file_path, { recursive: true });

                        model.event_log.write(res, req, 200, 'api/copy', 'Copy ' + chalk.yellow(src_file_path) + ' to ' + chalk.yellow(target_file_path));
                    } catch (e) {
                        model.event_log.write(res, req, 500, 'api/copy', 'Copy error: ', e.toString());

                        errors.push('Copy error');
                    }
                } else {
                    errors.push('Problem with: ' + clean_el);
                }
            }

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
