'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const urlencode = require('urlencode');
const shell = require('shelljs');
const exec = require('child_process').exec;
//const process = require('process');


const config = require('./config');
const util = require('./util');
const model = require(path.join(__dirname, '..', 'model', 'index'));


const homedir = os.homedir();
const httpup_home = path.join(homedir, '.httpup');
const httpup_thumb = path.join(homedir, '.httpup', 'thumb');
const httpup_temp = path.join(homedir, '.httpup', 'temp');



exports.api_edit = (app, argv) => {
    
    app.get('/__edit/*', async (req, res) => {
        
        
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = req_path.replace(/^\/__edit/, '');
        req_path = util.http_path_clear(req_path);
        
        
        let readFolder = argv.fold;
        let full_filename_orig = path.join(readFolder, req_path);
        
        let name = util.get_name(req_path);
        let ext = util.get_ext_norm(req_path);
        
        //console.log('name=', name);
        //console.log('ext=', ext);
        
        let is_doc_editable = ext.match(/^(txt|html|pdf|rtf|doc|docx|odt)$/i);

        if (!is_doc_editable) {
            
            //res.status(500).json({ code: 500, msg: 'Editor support only for text format and office files' });
            res.status(500).send(util.error_page_content('500', 'Editor support only for text format and office files'));
            return;
        }
        
        if( ext == 'pdf' ){
            res.status(500).send(util.error_page_content('500', 'PDF Edit temporary disabled'));
            return;
        }
        
        if( ext == 'txt' ){
            res.status(500).send(util.error_page_content('500', 'TXT Edit temporary disabled'));
            return;
        }
        
        if (!fs.existsSync(full_filename_orig)) {
            
            model.event_log().write( req, 404, 'edit', full_filename_orig );
            
            res.status(404).send(util.error_page_content('404', '404 Not found'));
            return;
        }
        
        
        
        
        
        let is_txt_editable = ext.match(/^(txt|html)$/i);
        
        if (is_txt_editable) {
            
            try{
                fs.copyFileSync(full_filename_orig, path.join(httpup_temp, name + '.' + 'html') )
                
                let file_data = fs.readFileSync(  path.join(httpup_temp, name + '.' + 'html')  );
                
                //console.log('without libreoffice');
                
                
                
                
                
                res.render('edit', {
                    full_path: req_path,
                    
                    file_data: file_data,
                    
                });
                return;
                
                
            }catch(e){
                
                model.event_log().write( req, 500, 'edit', 'copyFileSync error: ', e.toString() );
                
                res.status(500).json({ code: 500 });
                return;
            }
        }
        
        
        
        
        
        
        
        if (shell.exec('libreoffice --help', { silent: true }).code !== 0) {
        
            model.event_log().write( req, 500, 'edit', 'Error: libreoffice not found' );
            
            
            //res.status(500).json({ code: 500, msg: 'libreoffice not found' });
            res.status(500).send(util.error_page_content('500', 'libreoffice not found'));
            //argv.is_libreoffice = 2;
            return;
        }
        
        
        // libreoffice --headless --norestore --nologo --convert-to png --outdir ${httpup_thumb} "${full_filename_orig}"
        // libreoffice --headless --norestore --nologo --convert-to html:HTML --outdir ${httpup_thumb} "${full_filename_orig}"
        
        
        exec(
            `libreoffice --headless --norestore --nologo --convert-to html:HTML --outdir "${httpup_temp}" "${full_filename_orig}"`,
            function (error, stdout, stderr) {
                
                
                
                
                if (fs.existsSync(path.join(httpup_temp, name + '.html'))) {
                    
                    
                    
                    let file_data = fs.readFileSync(  path.join(httpup_temp, name + '.html')  );
                    
                    res.render('edit', {
                        full_path: req_path,
                        
                        file_data: file_data,
                        //file_name: name,
                    });
                }
                
            },
        );
        
        
        
    });
    
    
    
    const multer = require('multer');
    const upload = multer({ dest: httpup_temp, limits: { fieldSize: config.fieldSize_max } });

    const postProcessing = upload.fields([    { name: 'full_path', maxCount: 1 }, { name: 'body', maxCount: 1 }  ]);
    
    
    
    app.post('/api/edit', postProcessing, async (req, res) => {
        //let referer = urlencode.decode(url.parse(req.headers.referer).pathname);
        //referer = util.http_path_clear(referer);
        //let readFolder = path.join(argv.fold, referer);

        

        console.log('—'.repeat(process.stdout.columns));
        
        //console.log('req.body=', req.body);
        
        //let file_name = req.body.file_name;
        let full_path = req.body.full_path;
        let body = req.body.body;
        
        
        //console.log('full_path=', full_path);
        //console.log('body=', body);

        if (full_path && body) {
            
            
            let name = util.get_name(full_path);
            let target_ext = util.get_ext_norm(full_path);
            
            
            
            
            
            
            let full_filename_temp = path.join(httpup_temp, name + '.html')
            //console.log('full_filename_temp=', full_filename_temp);
            
            try{
                fs.writeFileSync( full_filename_temp, body );
                
                model.event_log().write( req, 200, 'api/edit', 'File ' + full_filename_temp + ' updated.' );
                
            }catch(e){
                
                model.event_log().write( req, 500, 'api/edit', 'writeFileSync error: ', e.toString() );
                
                res.status(500).json({ code: 500 });
                return;
            }
            
            
            
            
            
            
            
            
            let is_txt_editable = target_ext.match(/^(txt|html)$/i);
            
            
            
            if (is_txt_editable) {
                
                
                
                //let from = path.join(httpup_temp, name + '.' + 'html');
                let to = path.join(argv.fold, full_path);
                
                //console.log('without libreoffice');
                
                
                try{
                    fs.renameSync(full_filename_temp, to);
                    
                    model.event_log().write( req, 200, 'api/edit', 'fs.renameSync2', full_filename_temp, '=>', to );
                    
                    model.file().del(to);
                    
                    res.status(200).json({ code: 200 });
                    return;
                    
                }catch(e){
                    
                    model.event_log().write( req, 500, 'api/edit', 'fs.renameSync2', 'err=', e );
                    
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
                    convert_format = 'doc:MS Word 97'
                    break;
                case 'docx':
                    convert_format = 'docx:MS Word 2007 XML'
                    break;
                case 'odt':
                    convert_format = 'odt:writer8'
                    break;
                case 'rtf':
                    convert_format = 'rtf:Rich Text Format'
                    break;
                case 'pdf':
                    convert_format = 'pdf:writer_pdf_Export'
                    break;
                
            }
            
            //console.log(`libreoffice --headless --norestore --nologo --convert-to "${convert_format}" --outdir "${httpup_temp}" "${full_filename_temp}"`);
            
            
            exec(
                `libreoffice --headless --norestore --nologo --convert-to "${convert_format}" --outdir "${httpup_temp}" "${full_filename_temp}"`,
                function (error, stdout, stderr) {
                    
                    
                    
                    if (fs.existsSync(path.join(httpup_temp, name + '.' + target_ext))) {
                        
                        let from = path.join(httpup_temp, name + '.' + target_ext);
                        let to = path.join(argv.fold, full_path);
                        
                        
                        
                        
                        try{
                            fs.renameSync(from, to);
                            
                            model.event_log().write( req, 200, 'api/edit', 'fs.renameSync', from, '=>', to );
                            
                            model.file().del(to);
                            
                            res.status(200).json({ code: 200 });
                            return;
                            
                        }catch(e){
                            
                            model.event_log().write( req, 500, 'api/edit', 'fs.renameSync', 'err=', e );
                            
                            res.status(500).json({ code: 500 });
                            return;
                        }
                        
                        
                        
                        
                    }
                    
                },
            );
            
            
            
            
        }
        
        
        
        //res.status(500).json({ code: 500 });
    });
    
    
    
};

