

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


        if (fs.existsSync('/tmp/foldername1')) {
            fs.rmdirSync('/tmp/foldername1');
        }

        child = shell.exec('./bin/http-up /tmp ', {async:true});
    });


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );

        const formData  = new FormData();

        formData.append('name', 'foldername1');



        let response = await fetch(prefix + '/api/folder', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);

        child.kill();
        expect(response.status).toBe(200);





    }, 3_000);
})




describe("should 500", () => {


    let child;
    beforeAll(async() => {

        //fs.rmdirSync('/tmp/foldername1');

        child = shell.exec('./bin/http-up /tmp ', {async:true});
    });


    it("should 500", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/' );

        const formData  = new FormData();

        formData.append('name', 'foldername1');



        let response = await fetch(prefix + '/api/folder', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);

        child.kill();
        expect(response.status).toBe(500);





    }, 3_000);
})



