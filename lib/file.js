import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import * as dateTime from 'node-datetime';
import mime from 'mime';

export class TFile {
    constructor(fullPath) {
        this.fullPath = fullPath;

        this.fileName = '';
        this.ext = '';
        this.extNorm = '';
        this.fileNameExt = '';
        this.mimeType = ''; // mimetype: 'application/octet-stream'

        this.isPreviewImg = false;
        this.isPreviewDoc = false;
        this.isEditDoc = false;
        this.isEditCode = false;
        this.isEditMd = false;

        //this.stats = null;
        this.isDirectory = false;
        //this.isFIFO = false;
        this.isFile = false;
        //this.isSocket = false;
        //this.isSymbolicLink = false;

        this.size = 0;
        this.sizeHuman = '';
        this.mTime = 0;
        this.mTimeHuman = '';
        this.exists = false;

        if (fullPath && fullPath.length > 0) {
            this.init();
        }
    }

    init() {
        try {
            const stats = fsSync.statSync(this.fullPath);

            this.fileName = path.parse(this.fullPath).name;
            this.ext = path.parse(this.fullPath).ext;
            this.ext = this.ext.slice(1); // remove first symbol
            this.extNorm = this.ext.toLowerCase();
            if (this.extNorm && this.extNorm == 'jpeg') {
                this.extNorm = 'jpg';
            }
            if (this.ext && this.ext.length > 0) {
                this.fileNameExt = this.fileName + '.' + this.ext;
            } else {
                this.fileNameExt = this.fileName;
            }
            this.mimeType = mime.getType(this.ext);

            this.isPreviewImg = ['jpg', 'jpeg', 'png', 'gif'].includes(this.extNorm);
            this.isPreviewDoc = ['txt', 'pdf', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'ods'].includes(this.extNorm);

            this.isEditDoc = ['html', 'rtf', 'doc', 'docx', 'odt'].includes(this.extNorm);
            this.isEditCode = ['html', 'txt', 'js', 'css', 'md', 'sh', 'json'].includes(this.extNorm);
            this.isEditMd = ['md'].includes(this.extNorm);

            //this.stats = stats;
            this.isDirectory = stats.isDirectory();
            //this.isFIFO = stats.isFIFO();
            this.isFile = stats.isFile();
            //this.isSocket = stats.isSocket();
            //this.isSymbolicLink = stats.isSymbolicLink();

            this.size = stats.size;
            this.sizeHuman = this.humanFileSize(stats.size);

            this.mTime = stats.mtime;
            let modtime = dateTime.create(stats.mtime);
            this.mTimeHuman = modtime.format('Y-m-d H:M:S');

            this.exists = true;
        } catch (err) {
            // do not catching any here
            // full silence
        }
    }

    humanFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

        return bytes.toFixed(dp) + ' ' + units[u];
    }

    async copyTo(to) {
        if (!to || to.length == 0) {
            throw new Error(`Destination is required`);
        }

        return fs.copyFile(this.fullPath, to);
    }

    async moveTo(to) {
        return this.copyTo(to).then(() => {
            this.unlink();
        });
    }

    async unlink() {
        return fs.unlink(this.fullPath);
    }

    async returnFile(res) {
        try {
            const is_access = await fs.access(this.fullPath, fs.constants.R_OK);

            let mimeT = this.mimeType;

            const specialCase = ['application/json', 'application/xml', 'application/rss+xml'];

            if (mimeT.startsWith('text/') || specialCase.includes(mimeT)) {
                mimeT += '; charset=UTF-8';
            }

            res.setHeader('Content-Type', mimeT);
            res.sendFile(this.fullPath, { dotfiles: 'allow' }, (err) => {
                if (err) {
                    throw err;
                }
            });
        } catch (err) {
            throw err;
        }
    }

    async readFile() {
        return fs.readFile(this.fullPath);
    }
}
