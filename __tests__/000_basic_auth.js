

const shell = require('shelljs');

if (shell.exec('./bin/http-up --help', { silent: true }).code !== 0) {
    console.log('Error: ./bin/http-up');
    shell.exit(1);
    process.exit();
}



let url = 'http://127.0.0.1:4000/';




jest.useRealTimers();

describe("should auth success", () => {


    let child;
    beforeAll(async() => {
        child = shell.exec('./bin/http-up /tmp --user user1 --password password', {async:true});
    });


    it("should auth success", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + Buffer.from('user1' + ":" + 'password').toString('base64'));

        return fetch(url, {
            method:'GET',
            headers: headers,
        }).then((res) => {
            //console.log('res=', res);
            child.kill();
            expect(res.status).toBe(200);
        })


    }, 3_000);
})


describe("should auth fail", () => {


    let child;
    beforeAll(async() => {
        child = shell.exec('./bin/http-up /tmp --user userX --password passwordX', {async:true});
    });


    it("should auth fail", async () => {

        await new Promise((r) => setTimeout(r, 1000));

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + Buffer.from('user1' + ":" + 'password').toString('base64'));

        return fetch(url, {
            method:'GET',
            headers: headers,
        }).then((res) => {
            //console.log('res=', res);
            child.kill();
            expect(res.status).toBe(401);
        })


    }, 3_000);
})


