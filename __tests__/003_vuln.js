const fs = require('fs');
const shell = require('shelljs');

if (shell.exec('./bin/http-up --help', { silent: true }).code !== 0) {
    console.log('Error: ./bin/http-up not found');
    shell.exit(1);
    process.exit();
}

let prefix = 'http://127.0.0.1:4000';

jest.useRealTimers();

describe('should check several requests', () => {
    let child;
    beforeAll(async () => {
        /*
        if (!fs.existsSync('/tmp/foldXX/foldername2')) {
            fs.mkdirSync('/tmp/foldXX/foldername2', { recursive: true });
        }*/

        child = shell.exec('./bin/http-up /tmp', { async: true });
    });

    const endpoints = [
        { referer: prefix + '/', url: '/../etc/passwd', method: 'GET', expect_code: 404 },
        //{ referer: '', url: '', method: '', expect_code: 900, param_name: '', param_value: '', },
    ];

    it('should check several requests', async () => {
        await new Promise((r) => setTimeout(r, 1500));

        for (const endp of endpoints) {
            let options = {
                method: endp.method,
            };

            let headers = new Headers();
            headers.append('Referer', prefix + endp.referer);
            options['headers'] = headers;

            let formData = new FormData();
            if (endp.param_name) {
                formData.append(endp.param_name, endp.param_value);

                options['body'] = formData;
            }

            await fetch(prefix + endp.url, options)
                .then((res1) => {
                    console.log('res1=', res1);

                    expect(res1.status).toBe(endp.expect_code);
                })
                .catch((err1) => {
                    console.log('err1=', err1);
                });
        }
    }, 3_000);

    afterAll(() => {
        child.kill();

        /*
        if (fs.existsSync('/tmp/foldXX')) {
            fs.rmSync('/tmp/foldXX', { recursive: true, force: true });
        }*/
    });
});
