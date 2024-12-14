

const fs = require('fs');
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

        //fs.rmdirSync('/tmp/foldername1');
        if (fs.existsSync('/tmp/file1.jpg.crypt')) {
            fs.unlinkSync('/tmp/file1.jpg.crypt');
        }
        if (fs.existsSync('/tmp/file1.jpg')) {
            fs.unlinkSync('/tmp/file1.jpg');
        }

        child = shell.exec('./bin/http-up --extend-mode --crypt /tmp ', {async:true});
    });


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let tst_folder = __dirname;
        

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        
        
        // ------------------------------------------------------------------------------------------------------------------------------
        
        {
            
            headers.set('Cookie', 'mode=list; sort=name; ' );

            const formData  = new FormData();
            
            
            formData.append("fileBlob", new Blob([fs.readFileSync(tst_folder + '/file1.jpg')]), "file1.jpg");

            formData.append('fileMeta', JSON.stringify({name: 'file1.jpg'}));


            let response = await fetch(prefix + '/api/upload', {
                method:'POST',
                body: formData,
                headers: headers,
            });

            //let json = await response.json();
            //console.log('json=', json);
            expect(fs.existsSync('/tmp/file1.jpg')).toBe(true);
            
            if (fs.existsSync('/tmp/file1.jpg')) {
                fs.unlinkSync('/tmp/file1.jpg');
            }
        }
        

    }, 3_000);


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let tst_folder = __dirname;
        

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        
        
        // ------------------------------------------------------------------------------------------------------------------------------
        
        {
            
            headers.set('Cookie', 'mode=list; sort=name; code=' );

            const formData  = new FormData();
            
            
            formData.append("fileBlob", new Blob([fs.readFileSync(tst_folder + '/file1.jpg')]), "file1.jpg");

            formData.append('fileMeta', JSON.stringify({name: 'file1.jpg'}));


            let response = await fetch(prefix + '/api/upload', {
                method:'POST',
                body: formData,
                headers: headers,
            });

            //let json = await response.json();
            //console.log('json=', json);
            expect(fs.existsSync('/tmp/file1.jpg')).toBe(true);
            
            if (fs.existsSync('/tmp/file1.jpg')) {
                fs.unlinkSync('/tmp/file1.jpg');
            }
        }
        

    }, 3_000);
    
    
    
    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let tst_folder = __dirname;
        

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );
        
        
        
        // ------------------------------------------------------------------------------------------------------------------------------
        
        {
            
            headers.set('Cookie', 'mode=list; sort=name; code=aaa' );

            const formData  = new FormData();
            
            
            formData.append("fileBlob", new Blob([fs.readFileSync(tst_folder + '/file1.jpg')]), "file1.jpg");

            formData.append('fileMeta', JSON.stringify({name: 'file1.jpg'}));


            let response = await fetch(prefix + '/api/upload', {
                method:'POST',
                body: formData,
                headers: headers,
            });

            //let json = await response.json();
            //console.log('json=', json);
            expect(fs.existsSync('/tmp/file1.jpg.crypt')).toBe(true);
            
            if (fs.existsSync('/tmp/file1.jpg.crypt')) {
                fs.unlinkSync('/tmp/file1.jpg.crypt');
            }
        }
        

    }, 3_000);
    
    

    afterAll(() => {
        /*
        if (fs.existsSync('/tmp/file1.jpg.crypt')) {
            fs.unlinkSync('/tmp/file1.jpg.crypt');
        }
        if (fs.existsSync('/tmp/file1.jpg')) {
            fs.unlinkSync('/tmp/file1.jpg');
        }
        */
        
        child.kill();
    });


})







