//import fsSync from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import multer from 'multer';
import * as urlencode from 'urlencode';

import config from '../config.js';
import * as util from '../util.js';
import * as model from '../../model/index.js';

export const post_jserr = (app, argv) => {
    const upload = multer({
        dest: config.httpup_temp,
        limits: { fieldSize: config.fieldSize_max },
    });

    const postProcessing = upload.fields([
        { name: 'msg', maxCount: 1 },
        { name: 'path', maxCount: 1 },
    ]);

    app.post('/api/jserr', postProcessing, (req, res) => {
        let referer = util.get_pathname(req.headers.referer);
        referer = util.http_path_clear(referer);
        let readFolder = path.join(argv.fold, referer);

        console.log('—'.repeat(process.stdout.columns));

        if (typeof req.body.msg == 'string') {
            let clean_msg = urlencode.decode(req.body.msg);
            let clean_path = urlencode.decode(req.body.path);

            model.event_log.write(res, req, 500, 'api/jserr', 'Path:' + chalk.yellow(clean_path) + ' Msg:' + chalk.yellow(clean_msg));
        }

        res.status(200).json({ code: 200 });
    });
};
