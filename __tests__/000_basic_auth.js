const shell = require('shelljs');

if (shell.exec('./bin/http-up --help', { silent: true }).code !== 0) {
    console.log('Error: ./bin/http-up not found');
    shell.exit(1);
    process.exit();
}

//shell.exec("ps auxf | grep 'http-up' | grep -v grep | awk '{print $2}' | xargs kill", {async:false});

let prefix = 'http://127.0.0.1:4000/';

jest.useRealTimers();

describe('should auth success', () => {
    let child;
    beforeAll(async () => {
        child = shell.exec('./bin/http-up /tmp --login user1 --password password', { async: true });
    });

    it('should auth success', async () => {
        await new Promise((r) => setTimeout(r, 1500));

        let headers = new Headers();
        //let hash = Buffer.from('user1' + ":" + 'password').toString('base64');
        //console.log('hash=', hash);
        headers.set('Authorization', 'Basic ' + Buffer.from('user1' + ':' + 'password').toString('base64'));

        return fetch(prefix, {
            method: 'GET',
            headers: headers,
        })
            .then((res1) => {
                //console.log('res1=', res1);
                child.kill();
                expect(res1.status).toBe(200);
            })
            .catch((err1) => {
                //console.log('err1=', err1);
            });

        //await new Promise((r) => setTimeout(r, 2000));
    }, 3_000);
});

describe('should auth fail', () => {
    let child;
    beforeAll(async () => {
        child = shell.exec('./bin/http-up /tmp --login userX --password passwordX', { async: true });
    });

    it('should auth fail', async () => {
        await new Promise((r) => setTimeout(r, 1500));

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + Buffer.from('user1' + ':' + 'password').toString('base64'));

        return fetch(prefix, {
            method: 'GET',
            headers: headers,
        })
            .then((res2) => {
                //console.log('res2=', res2);
                child.kill();
                expect(res2.status).toBe(401);
            })
            .catch((err2) => {
                //console.log('err2=', err2);
            });

        //await new Promise((r) => setTimeout(r, 2000));
    }, 3_000);
});
