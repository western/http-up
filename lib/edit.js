import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';

import * as urlencode from 'urlencode';
import shell from 'shelljs';
import multer from 'multer';

import config from '../lib/config.js';
import * as util from '../lib/util.js';
import * as model from '../model/index.js';

export const api_edit = (app, argv) => {
    app.get('/__doc/*splat', async (req, res) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__doc/, '');
        req_path = util.http_path_clear(req_path);

        let readFolder = argv.fold;
        let full_filename_orig = path.join(readFolder, req_path);

        let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);

        let is_doc_editable = ext.match(/^(html|rtf|doc|docx|odt)$/i);

        if (!is_doc_editable) {
            res.status(500).send(util.error_page_content('500', 'Editor support only for text format and office files'));
            return;
        }

        if (ext == 'pdf') {
            res.status(500).send(util.error_page_content('500', 'PDF Edit temporary disabled'));
            return;
        }

        if (ext == 'txt') {
            res.status(500).send(util.error_page_content('500', 'TXT Edit temporary disabled'));
            return;
        }

        if (!fsSync.existsSync(full_filename_orig)) {
            model.event_log.write(res, req, 404, 'edit', full_filename_orig);

            res.status(404).send(util.error_page_content('404', '404 Not found'));
            return;
        }

        let is_txt_editable = ext.match(/^(html)$/i);

        if (is_txt_editable) {
            try {
                fsSync.copyFileSync(full_filename_orig, path.join(config.httpup_temp, name + '.' + 'html'));

                let file_data = fsSync.readFileSync(path.join(config.httpup_temp, name + '.' + 'html'));

                res.render('edit_doc', {
                    file_name: name + '.' + ext,
                    full_path: req_path,

                    file_data: file_data,

                    csrf_token: !argv['csrf-disable'] ? req.csrfToken() : '',
                });
                model.event_log.write(res, req, 200, 'api/edit', 'Open file ' + full_filename_orig + ' for edit');
                return;
            } catch (e) {
                model.event_log.write(res, req, 500, 'edit', 'copyFileSync error: ', e.toString());

                res.status(500).json({ code: 500 });
                return;
            }
        }

        if (shell.exec('libreoffice --help', { silent: true }).code !== 0) {
            model.event_log.write(res, req, 500, 'edit', 'Error: libreoffice not found');

            res.status(500).send(util.error_page_content('500', 'libreoffice not found'));

            return;
        }

        exec(
            `libreoffice --headless --norestore --nologo --convert-to html:HTML --outdir "${config.httpup_temp}" "${full_filename_orig}"`,
            function (error, stdout, stderr) {
                if (fsSync.existsSync(path.join(config.httpup_temp, name + '.html'))) {
                    let file_data = fsSync.readFileSync(path.join(config.httpup_temp, name + '.html'));

                    res.render('edit_doc', {
                        file_name: name + '.' + ext,
                        full_path: req_path,

                        file_data: file_data,

                        csrf_token: !argv['csrf-disable'] ? req.csrfToken() : '',
                    });
                    model.event_log.write(res, req, 200, 'api/edit', 'Open file ' + full_filename_orig + ' for edit');
                }
            },
        );
    });

    app.get('/__code/*splat', async (req, res) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__code/, '');
        req_path = util.http_path_clear(req_path);

        let readFolder = argv.fold;
        let full_filename_orig = path.join(readFolder, req_path);

        let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);

        let is_doc_editable = ext.match(/^(html|txt|js|css|md|sh|json)$/i);

        if (!is_doc_editable) {
            res.status(500).send(util.error_page_content('500', 'Editor support only for text format files'));
            return;
        }

        if (!fsSync.existsSync(full_filename_orig)) {
            model.event_log.write(res, req, 404, 'edit', full_filename_orig);

            res.status(404).send(util.error_page_content('404', '404 Not found'));
            return;
        }

        try {
            fsSync.copyFileSync(full_filename_orig, path.join(config.httpup_temp, name + '.' + ext));

            let file_data = fsSync.readFileSync(path.join(config.httpup_temp, name + '.' + ext));

            res.render('edit_code', {
                file_name: name + '.' + ext,
                full_path: req_path,

                file_data: file_data,

                csrf_token: !argv['csrf-disable'] ? req.csrfToken() : '',
            });
            model.event_log.write(res, req, 200, 'api/edit', 'Open file ' + full_filename_orig + ' for edit');
            return;
        } catch (e) {
            model.event_log.write(res, req, 500, 'edit', 'copyFileSync error: ', e.toString());

            res.status(500).json({ code: 500 });
            return;
        }
    });

    app.get('/__md/*splat', async (req, res) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__md/, '');
        req_path = util.http_path_clear(req_path);

        let readFolder = argv.fold;
        let full_filename_orig = path.join(readFolder, req_path);

        let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);

        let is_md_editable = ext.match(/^(md)$/i);

        if (!is_md_editable) {
            res.status(500).send(util.error_page_content('500', 'Editor support only for markdown format files'));
            return;
        }

        if (!fsSync.existsSync(full_filename_orig)) {
            model.event_log.write(res, req, 404, 'edit', full_filename_orig);

            res.status(404).send(util.error_page_content('404', '404 Not found'));
            return;
        }

        try {
            fsSync.copyFileSync(full_filename_orig, path.join(config.httpup_temp, name + '.' + ext));

            let file_data = fsSync.readFileSync(path.join(config.httpup_temp, name + '.' + ext));

            res.render('edit_md', {
                file_name: name + '.' + ext,
                full_path: req_path,

                file_data: file_data,

                csrf_token: !argv['csrf-disable'] ? req.csrfToken() : '',
            });
            model.event_log.write(res, req, 200, 'api/edit', 'Open file ' + full_filename_orig + ' for edit');
            return;
        } catch (e) {
            model.event_log.write(res, req, 500, 'edit', 'copyFileSync error: ', e.toString());

            res.status(500).json({ code: 500 });
            return;
        }
    });

    const upload = multer({ dest: config.httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([
        { name: 'full_path', maxCount: 1 },
        { name: 'body', maxCount: 1 },
    ]);

    app.post('/api/file/edit', postProcessing, async (req, res) => {
        console.log('—'.repeat(process.stdout.columns));

        let full_path = req.body.full_path;
        let body = req.body.body;
        let save_as_source = req.body.save_as_source;

        if (full_path) {
            let name = util.get_name(full_path);
            let target_ext = util.get_ext_norm(full_path);

            if (save_as_source) {
                let full_filename_temp = path.join(config.httpup_temp, name + '.' + target_ext);

                try {
                    fsSync.writeFileSync(full_filename_temp, body);

                    model.event_log.write(res, req, 200, 'api/edit', 'File ' + full_filename_temp + ' updated.');
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/edit', 'writeFileSync error: ', e.toString());

                    res.status(500).json({ code: 500 });
                    return;
                }

                let to = path.join(argv.fold, full_path);

                try {
                    fsSync.copyFileSync(full_filename_temp, to);

                    model.event_log.write(res, req, 200, 'api/edit', 'fs.renameSync3', full_filename_temp, '=>', to);

                    res.status(200).json({ code: 200 });
                    return;
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/edit', 'fs.renameSync3', 'err=', e);

                    res.status(500).json({ code: 500 });
                    return;
                }
            }

            let full_filename_temp = path.join(config.httpup_temp, name + '.html');

            try {
                fsSync.writeFileSync(full_filename_temp, body);

                model.event_log.write(res, req, 200, 'api/edit', 'File ' + full_filename_temp + ' updated.');
            } catch (e) {
                model.event_log.write(res, req, 500, 'api/edit', 'writeFileSync error: ', e.toString());

                res.status(500).json({ code: 500 });
                return;
            }

            let is_txt_editable = target_ext.match(/^(html)$/i);

            if (is_txt_editable) {
                //let from = path.join(config.httpup_temp, name + '.' + 'html');
                let to = path.join(argv.fold, full_path);

                try {
                    fsSync.copyFileSync(full_filename_temp, to);

                    model.event_log.write(res, req, 200, 'api/edit', 'fs.renameSync2', full_filename_temp, '=>', to);

                    res.status(200).json({ code: 200 });
                    return;
                } catch (e) {
                    model.event_log.write(res, req, 500, 'api/edit', 'fs.renameSync2', 'err=', e);

                    res.status(500).json({ code: 500 });
                    return;
                }
            }

            let convert_format = '';

            // https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html
            // (txt|pdf|rtf|doc|docx|odt)
            //
            // --convert-to "txt:Text (encoded):UTF8" *.doc
            // "Rich Text Format"
            switch (target_ext) {
                case 'doc':
                    convert_format = 'doc:MS Word 97';
                    break;
                case 'docx':
                    convert_format = 'docx:MS Word 2007 XML';
                    break;
                case 'odt':
                    convert_format = 'odt:writer8';
                    break;
                case 'rtf':
                    convert_format = 'rtf:Rich Text Format';
                    break;
                case 'pdf':
                    convert_format = 'pdf:writer_pdf_Export';
                    break;
            }

            exec(
                `libreoffice --headless --norestore --nologo --convert-to "${convert_format}" --outdir "${config.httpup_temp}" "${full_filename_temp}"`,
                function (error, stdout, stderr) {
                    if (fsSync.existsSync(path.join(config.httpup_temp, name + '.' + target_ext))) {
                        let from = path.join(config.httpup_temp, name + '.' + target_ext);
                        let to = path.join(argv.fold, full_path);

                        try {
                            fsSync.copyFileSync(from, to);

                            model.event_log.write(res, req, 200, 'api/edit', 'fs.copyFile', from, '=>', to);

                            res.status(200).json({ code: 200 });
                            return;
                        } catch (e) {
                            model.event_log.write(res, req, 500, 'api/edit', 'fs.copyFile', 'err=', e);

                            res.status(500).json({ code: 500 });
                            return;
                        }
                    }
                },
            );
        }
    });
};
