

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');


if (shell.exec('./bin/http-up --help', { silent: true }).code !== 0) {
    console.log('Error: ./bin/http-up not found');
    shell.exit(1);
    process.exit();
}

//shell.exec("ps auxf | grep 'http-up' | grep -v grep | awk '{print $2}' | xargs kill", {async:false});

let prefix = 'http://127.0.0.1:4000';




jest.useRealTimers();

describe("should 200", () => {



    let child;
    beforeAll(async() => {
        
        let src_file_path = path.join(__dirname, 'file1.jpg');
        
        fs.cp(src_file_path, path.join('/tmp', 'file1.jpg'), { recursive: false }, (err) => {
            if (err) {
                console.log(clp, 'Copy err=', err);
            }
        });
        
        
        if (fs.existsSync('/tmp/file2.jpg')) {
            fs.unlinkSync('/tmp/file2.jpg');
        }
        
        
        fs.cp(src_file_path, path.join('/tmp', 'file3.jpg.crypt'), { recursive: false }, (err) => {
            if (err) {
                console.log(clp, 'Copy err=', err);
            }
        });

        child = shell.exec('./bin/http-up --extend-mode --crypt /tmp ', {async:true});
    });


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        

        let headers = new Headers();
        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        
        headers.set('Cookie', 'mode=list; sort=name; ' );

        const formData  = new FormData();
        
        
        formData.append("fileBlob", new Blob([fs.readFileSync(__dirname + '/file1.jpg')]), "file1.jpg");

        formData.append('fileMeta', JSON.stringify({name: 'file1.jpg'}));


        let response = await fetch(prefix + '/api/file/upload', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);
        
        expect(fs.existsSync('/tmp/file1.jpg')).toBe(true);
        
        
        

    }, 3_000);


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        
        let headers = new Headers();
        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        headers.set('Cookie', 'mode=list; sort=name; code=' );

        const formData  = new FormData();
        
        
        formData.append("fileBlob", new Blob([fs.readFileSync(__dirname + '/file1.jpg')]), "file2.jpg");

        formData.append('fileMeta', JSON.stringify({name: 'file2.jpg'}));


        let response = await fetch(prefix + '/api/file/upload', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);
        
        expect(fs.existsSync('/tmp/file2.jpg')).toBe(true);
        
        

    }, 3_000);
    
    
    
    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        
        

        let headers = new Headers();
        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        
        
        
        headers.set('Cookie', 'mode=list; sort=name; code=aaa' );

        const formData  = new FormData();
        
        
        formData.append("fileBlob", new Blob([fs.readFileSync(__dirname + '/file1.jpg')]), "file3.jpg");

        formData.append('fileMeta', JSON.stringify({name: 'file3.jpg'}));


        let response = await fetch(prefix + '/api/file/upload', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);
        
        expect(fs.existsSync('/tmp/file3.jpg.crypt')).toBe(true);
        
            
        
        

    }, 3_000);
    
    

    afterAll(() => {
        
        
        
        child.kill();
        
        
        
        if (fs.existsSync('/tmp/file1.jpg')) {
            fs.unlinkSync('/tmp/file1.jpg');
        }
        if (fs.existsSync('/tmp/file2.jpg')) {
            fs.unlinkSync('/tmp/file2.jpg');
        }
        if (fs.existsSync('/tmp/file3.jpg.crypt')) {
            fs.unlinkSync('/tmp/file3.jpg.crypt');
        }
        
        
    });


})







