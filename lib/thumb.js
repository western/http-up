import fs from 'fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import * as urlencode from 'urlencode';
import mime from 'mime';
import { exec } from 'child_process';
import { promisify } from 'util';

import md5File from 'md5-file';
import imageThumbnail from 'image-thumbnail';

import config from '../lib/config.js';
import * as util from '../lib/util.js';
import * as model from '../model/index.js';

const execAsync = promisify(exec);

class fileProcessor {
    constructor(thumb_path) {
        this.thumb_path = thumb_path;
        this.chkThumbFolderExist();
    }

    async chkThumbFolderExist() {
        try {
            await fs.mkdir(this.thumb_path, { recursive: true });
        } catch (err) {
            throw new Error(`Failed to create thumbnail directory: ${err.message}`);
        }
    }

    getThumbPath(md5) {
        return path.join(this.thumb_path, md5);
    }

    async generateMD5(full_path) {
        try {
            const hash = md5File.sync(full_path);
            return hash;
        } catch (err) {
            throw err;
        }
    }

    async getStat(full_path) {
        try {
            const stats = await fs.stat(full_path);
            return {
                size: stats.size,
                mtime: stats.mtime,
                exists: true,
            };
        } catch (err) {
            if (err.code === 'ENOENT') {
                return { exists: false };
            }
            throw err;
        }
    }

    async returnFile(file_path, ext, res) {
        res.setHeader('Content-Type', mime.getType(ext));
        res.sendFile(file_path, { dotfiles: 'allow' }, (err) => {
            if (err) {
                console.error(`sendfile err: [${err.message}] [${file_path}]`);
            }
        });

        /*
        try {
            const data = await fs.readFile(file_path);
            res.setHeader('Content-Type', mime.getType(ext));
            res.status(200).send(data);
            console.log('returnFile res.send');
            return true;
        } catch (err) {
            //throw new Error(`returnFile err: ${err.message}`);
            console.error(`returnFile err2: ${err.message}`);
        }
        */
    }

    async isThumbValid(full_path) {
        try {
            const stats = await fs.stat(full_path);
            if (stats.size == 0) {
                return false;
            }
            return true;
        } catch (err) {
            //throw err;
            return false;
        }
    }

    async removeThumb(full_path) {
        try {
            await fs.unlink(full_path);
        } catch (err) {}
    }

    handleError(req, res, err, tag) {
        const msg = err.message || 'Unknown error';

        model.event_log.write(res, req, 500, tag, msg);

        res.status(500).json({
            code: 500,
            msg: msg,
        });
    }
}

class imageProcessor extends fileProcessor {
    async process(req, res, full_filename_orig, ext) {
        try {
            const stats = await this.getStat(full_filename_orig);
            if (!stats.exists) {
                throw new Error('File not found');
            }

            if (stats.size <= config.thumb.IMG.max_size) {
                this.returnFile(full_filename_orig, ext, res);
                model.event_log.print(res, req, 200, 'thumb/img', 'Send original (small file)', chalk.yellow(full_filename_orig));
                return;
            }

            const md5 = await this.generateMD5(full_filename_orig);
            if (!md5) {
                throw new Error('Failed to generate MD5 hash ' + full_filename_orig);
            }

            const thumb_path = this.getThumbPath(md5);

            if (await this.isThumbValid(thumb_path)) {
                this.returnFile(thumb_path, ext, res);
                model.event_log.print(res, req, 200, 'thumb/img', 'Send thumbnail', chalk.yellow(full_filename_orig));
                return;
            }

            await this.removeThumb(thumb_path);

            this.generateImage(full_filename_orig, thumb_path, ext, req, res);
        } catch (err) {
            this.handleError(req, res, err, 'thumb/img');
        }
    }

    async generateImage(src_path, thumb_path, ext, req, res) {
        try {
            let options = { width: config.thumb.IMG.width, withMetaData: false };
            const b = await imageThumbnail(src_path, options);

            fs.writeFile(thumb_path, b, 'binary', (err) => {
                if (err) {
                    console.log(err);
                }
            });

            this.returnFile(thumb_path, ext, res);
            model.event_log.print(res, req, 200, 'thumb/img', 'Create and send thumbnail', chalk.yellow(src_path));
        } catch (err) {
            console.error('Failed to generate image thumbnail:', err);
        }
    }
}

class documentProcessor extends fileProcessor {
    async process(req, res, full_filename_orig, ext) {
        try {
            const stats = await this.getStat(full_filename_orig);
            if (!stats.exists) {
                throw new Error('File not found');
            }

            const md5 = await this.generateMD5(full_filename_orig);
            if (!md5) {
                throw new Error('Failed to generate MD5 hash ' + full_filename_orig);
            }

            const thumb_path = this.getThumbPath(md5);

            if (await this.isThumbValid(thumb_path)) {
                this.returnFile(thumb_path, 'png', res);
                model.event_log.print(res, req, 200, 'thumb/doc', 'Send thumbnail', chalk.yellow(full_filename_orig));
                return;
            }

            await this.removeThumb(thumb_path);

            this.generateImage(full_filename_orig, thumb_path, ext, req, res);
        } catch (err) {
            this.handleError(req, res, err, 'thumb/doc');
        }
    }

    async generateImage(src_path, thumb_path, ext, req, res) {
        try {
            const command = `libreoffice --headless --norestore --nologo --convert-to png --outdir "${config.httpup_thumb}" "${src_path}"`;

            execAsync(command)
                .then(async (out) => {
                    const file_name = path.basename(src_path, path.extname(src_path));

                    const generated_path = path.join(config.httpup_thumb, file_name + '.png');

                    const stats = await fs.stat(generated_path);
                    if (stats.size > 0) {
                        await fs.rename(generated_path, thumb_path);
                    }

                    await this.returnFile(thumb_path, 'png', res);
                    model.event_log.print(res, req, 200, 'thumb/doc', 'Make thumb and return for doc', chalk.yellow(src_path));
                })
                .catch((err) => {
                    //console.log('execAsync err=', err)
                });
        } catch (err) {
            console.error('Failed to generate doc thumbnail:', err);
        }
    }
}

export const api_thumb = (app, argv) => {
    const imgProcessor = new imageProcessor(config.httpup_thumb);
    const docProcessor = new documentProcessor(config.httpup_thumb);

    app.get('/__thumb/*splat', async (req, res, next) => {
        try {
            let req_path = req.path;
            req_path = urlencode.decode(req_path);
            req_path = req_path.replace(/^\/__thumb/, '');
            req_path = util.http_path_clear(req_path);

            res.locals.argv = argv;
            res.locals.req_path = req_path;

            const ext = util.get_ext_norm(req_path);
            const full_filename_orig = path.join(argv.fold, req_path);

            const stats = await fs.stat(full_filename_orig).catch(() => null);
            if (!stats) {
                model.event_log.write(res, req, 404, 'thumb', full_filename_orig);
                return res.status(404).json({ code: 404, message: 'File not found' });
            }

            const is_image = config.thumb.IMG.format.includes(ext);
            const is_doc = config.thumb.DOC.format.includes(ext);

            if (!is_image && !is_doc) {
                model.event_log.write(res, req, 400, 'thumb', `Unsupported file format for thumbnails: ${full_filename_orig}`);
                return res.status(400).json({
                    code: 400,
                    message: 'Unsupported file format for thumbnails',
                });
            }

            if (is_image) {
                imgProcessor.process(req, res, full_filename_orig, ext);
            } else if (is_doc) {
                docProcessor.process(req, res, full_filename_orig, ext);
            }
        } catch (err) {
            const msg = err.message || 'Unknown error';
            model.event_log.write(res, req, 500, 'thumb', msg);
            res.status(500).json({ code: 500, message: msg });
        }
    });
};
