

const fs = require('fs');
const shell = require('shelljs');


if (shell.exec('./bin/http-up --help', { silent: true }).code !== 0) {
    console.log('Error: ./bin/http-up not found');
    shell.exit(1);
    process.exit();
}




let prefix = 'http://127.0.0.1:4000';




jest.useRealTimers();

describe("should 200", () => {


    let child;
    beforeAll(async() => {

        if (!fs.existsSync('/tmp/foldXX/foldername2')) {
            fs.mkdirSync('/tmp/foldXX/foldername2', { recursive: true });
        }

        //child = shell.exec('./bin/http-up /tmp ', {async:true});
    });


    it("should 200", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let headers = new Headers();

        headers.append('Origin', 'http://127.0.0.1:4000' );
        headers.append('Referer', 'http://127.0.0.1:4000/foldXX/../../' );
        //headers.append('Referer', 'http://127.0.0.1:4000/foldXX' );
        //headers.append('Referer', 'http://127.0.0.1:4000/foldXX//' );
        //headers.append('Referer', 'http://127.0.0.1:4000/foldXX/./t' );

        const formData  = new FormData();

        formData.append('name', '/../../foldernameT/./');



        let response = await fetch(prefix + '/api/folder', {
            method:'POST',
            body: formData,
            headers: headers,
        });

        let json = await response.json();
        console.log('json=', json);

        //child.kill();
        expect(response.status).toBe(200);
        expect(json.result).toBe('/foldXX/foldernameT');


    }, 3_000);


    afterAll(() => {
        if (fs.existsSync('/tmp/foldXX/foldernameT')) {
            fs.rmdirSync('/tmp/foldXX/foldernameT');
        }
        if (fs.existsSync('/tmp/foldXX/foldername2')) {
            fs.rmdirSync('/tmp/foldXX/foldername2');
        }
        if (fs.existsSync('/tmp/foldXX')) {
            fs.rmdirSync('/tmp/foldXX');
        }
    });

})







