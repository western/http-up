import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import multer from 'multer';

import config from '../config.js';
import * as model from '../../model/index.js';

export const post_file_part = (app, argv) => {
    class partUploadEngine {
        constructor(args = {}) {
            if (!args.root_fold) {
                throw new Error('partUploadEngine.root_fold is mandatory arg');
            }
            if (!args.temp_fold) {
                throw new Error('partUploadEngine.temp_fold is mandatory arg');
            }

            this.root_fold = args.root_fold;

            this.temp_fold = args.temp_fold;
            this.mkTempFolder();
        }

        async mkTempFolder() {
            try {
                await fs.mkdir(this.temp_fold, { recursive: true });
            } catch (err) {
                throw new Error(`Failed to create directory: ${err.message}`);
            }
        }

        async assembleFile(req, res, file_id, chunk_cnt) {
            const arr = file_id.split('--');

            const writeStream = fsSync.createWriteStream(path.join(this.temp_fold, arr[0]));

            for (let i = 0; i < chunk_cnt; i++) {
                let target_file_path = path.join(this.temp_fold, file_id + '.' + i);
                //console.log('target_file_path=', target_file_path);

                const data = fsSync.readFileSync(target_file_path);
                writeStream.write(data);
            }

            writeStream.end();

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            //console.log('assembled!');
            model.event_log.write(res, req, 200, 'api/file/part', 'File ' + chalk.green(arr[0]) + ' was assembled');
        }

        async copyAssembledTo(req, res, file_id, to_path) {
            const arr = file_id.split('--');

            let src_file_path = path.join(this.temp_fold, arr[0]);
            let target_file_path = path.join(this.root_fold, to_path, arr[0]);

            return fs
                .copyFile(src_file_path, target_file_path)
                .then(() => {
                    console.log('—'.repeat(process.stdout.columns));

                    model.event_log.write(
                        res,
                        req,
                        200,
                        'api/file/part',
                        'File ' + chalk.green(src_file_path) + ' => ' + chalk.green(target_file_path) + ' copied',
                    );
                    //console.log(src_file_path, ' => ', target_file_path, 'copy done');

                    //res.status(200).json({ code: 200 });
                })
                .catch((err) => {
                    throw err;
                });
        }

        async handleUpload(req, res) {
            const file_id = req.body.file_id;
            const data = req.files.data[0];
            const chunk_index = req.body.chunk_index;

            if (!file_id) {
                model.event_log.write(res, req, 500, 'api/file/part', 'file_id is required field');
                res.status(500).json({ code: 500, msg: 'file_id is required field' });
                return;
            }
            if (!data) {
                model.event_log.write(res, req, 500, 'api/file/part', 'data is required field');
                res.status(500).json({ code: 500, msg: 'data is required field' });
                return;
            }
            if (isNaN(chunk_index)) {
                model.event_log.write(res, req, 500, 'api/file/part', 'chunk_index is required field');
                res.status(500).json({ code: 500, msg: 'chunk_index is required field' });
                return;
            }

            let target_file_path = path.join(this.temp_fold, file_id + '.' + chunk_index);
            //console.log('handleUpload target_file_path=', target_file_path)

            try {
                fs.copyFile(data.path, target_file_path)
                    .then(() => {
                        model.event_log.write(res, req, 200, 'api/file/part', 'File ' + chalk.green(target_file_path) + ' was saved');
                        //console.log(target_file_path, 'saved');

                        res.status(200).json({ code: 200 });
                    })
                    .catch((err) => {
                        throw err;
                    });
            } catch (err) {
                model.event_log.write(res, req, 500, 'api/file/part', 'Err ', err);
                res.status(500).json({ code: 500 });
            }
        }

        async handleUploadDone(req, res) {
            const file_id = req.body.file_id;
            const to_path = req.body.to_path;
            const chunk_cnt = req.body.chunk_cnt;

            if (!file_id) {
                res.status(500).json({ code: 500, msg: 'file_id is required field' });
                return;
            }
            if (!to_path) {
                res.status(500).json({ code: 500, msg: 'to_path is required field' });
                return;
            }
            if (!chunk_cnt) {
                res.status(500).json({ code: 500, msg: 'chunk_cnt is required field' });
                return;
            }

            //console.log('file_id=', file_id);
            //console.log('to_path=', to_path);

            try {
                this.assembleFile(req, res, file_id, chunk_cnt).then(() => {
                    this.copyAssembledTo(req, res, file_id, to_path).then(() => {
                        res.status(200).json({ code: 200 });
                    });
                });
            } catch (err) {
                model.event_log.write(res, req, 500, 'api/file/part', 'Err ', err);
                res.status(500).json({ code: 500 });
            }
        }
    }

    // ----------------------------------------------------------------------------------------------------------------------------------------

    const upload = multer({
        dest: config.httpup_temp,
        limits: { fieldSize: config.fieldSize_max },
    });

    const postProcessing = upload.fields([{ name: 'data' }]);

    // ----------------------------------------------------------------------------------------------------------------------------------------

    const puEngine = new partUploadEngine({
        root_fold: argv.fold,
        temp_fold: config.httpup_parts,
    });

    app.post('/api/file/part', postProcessing, async (req, res) => {
        puEngine.handleUpload(req, res);
    });

    app.post('/api/file/part/done', postProcessing, async (req, res) => {
        puEngine.handleUploadDone(req, res);
    });

    // ----------------------------------------------------------------------------------------------------------------------------------------
};
