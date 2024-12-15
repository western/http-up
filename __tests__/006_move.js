

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
        let target_file_path = path.join('/tmp', 'file1.jpg');
        
        fs.cp(src_file_path, target_file_path, { recursive: false }, (err) => {
            if (err) {
                console.log(clp, 'Copy err=', err);
            }
            
        });
        
        if (!fs.existsSync('/tmp/fold9')) {
            fs.mkdirSync('/tmp/fold9');
        }

        child = shell.exec('./bin/http-up --extend-mode /tmp ', {async:true});
    });


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );

        
        const formData  = new FormData();
        formData.append('name', 'file1.jpg');
        formData.append('to', 'fold9');


        let response = await fetch(prefix + '/api/move', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);
        
        //let body = await response.text();
        //console.log('body=', body)

        
        expect(response.status).toBe(200);

    }, 3_000);


    afterAll(() => {
        
        child.kill();
        
        if (fs.existsSync('/tmp/file1.jpg')) {
            fs.unlinkSync('/tmp/file1.jpg');
        }
        
        if (fs.existsSync('/tmp/fold9')) {
            fs.rmSync('/tmp/fold9', { recursive: true, force: true });
        }
        
        
    });


})







