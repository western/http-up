import os from 'os';
import fs from 'fs';
import path from 'node:path';
import chalk from 'chalk';
import shell from 'shelljs';

import config from '../lib/config.js';

export const openssl_make_keys = (argv) => {
    if (!fs.existsSync(path.join(config.httpup_home, '/tls/server.crt'))) {
        console.log(chalk.yellow('Generate new TLS keys via openssl'));
        console.log('');

        if (shell.exec('openssl ', { silent: true }).code !== 0) {
            console.log('Error: openssl not found');
            shell.exit(1);
            process.exit();
        }

        if (!fs.existsSync(config.httpup_home + '/tls')) {
            fs.mkdirSync(config.httpup_home + '/tls');
        }

        shell.cd(config.httpup_home + '/tls');

        if (shell.exec('openssl genrsa -out server.key 2048', { silent: true }).code !== 0) {
            console.log('Error: openssl 1');
            shell.exit(1);
            process.exit();
        }

        if (
            shell.exec(
                `
            
            openssl req \
                -new \
                -newkey rsa:2048 \
                -days 3650 \
                -nodes \
                -x509 \
                -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" \
                -key server.key \
                -out server.crt
                
        `,
                { silent: true },
            ).code !== 0
        ) {
            console.log('Error: openssl 2');
            shell.exit(1);
            process.exit();
        }
    }
};

export const easyrsa_make_keys = (argv) => {
    let is_silent = true;
    if (argv['tls-debug']) {
        is_silent = false;
    }

    if (!fs.existsSync(path.join(config.httpup_home, '/easyrsa/pki/issued/server1.crt'))) {
        console.log(chalk.yellow('Generate new TLS keys via easyrsa'));
        console.log('');

        if (shell.exec('easyrsa ', { silent: true }).code !== 0) {
            console.log('Error: easyrsa not found');
            shell.exit(1);
            process.exit();
        }

        if (argv['tls-debug']) {
            console.log('—'.repeat(process.stdout.columns));
            console.log('');
        }

        if (!fs.existsSync(config.httpup_home + '/easyrsa')) {
            fs.mkdirSync(config.httpup_home + '/easyrsa');
        }

        shell.cd(config.httpup_home + '/easyrsa');

        if (argv['tls-debug']) {
            console.log('—'.repeat(process.stdout.columns));
            console.log('');
        }

        if (shell.exec('easyrsa init-pki', { silent: is_silent }).code !== 0) {
            console.log('Error: easyrsa init-pki');
            shell.exit(1);
            process.exit();
        }

        let vars_data = `
set_var EASYRSA_DN "cn_only"
set_var EASYRSA_KEY_SIZE 2048
set_var EASYRSA_REQ_CN   "ca@desec.example.com"
set_var EASYRSA_BATCH    "yes"
set_var EASYRSA_CA_EXPIRE 3650
set_var EASYRSA_CERT_EXPIRE 3650
        `;
        fs.writeFileSync(path.join(config.httpup_home, '/easyrsa/pki/vars'), vars_data);

        if (argv['tls-debug']) {
            console.log('—'.repeat(process.stdout.columns));
            console.log('');
        }

        if (shell.exec('easyrsa build-ca nopass', { silent: is_silent }).code !== 0) {
            console.log('Error: easyrsa build-ca nopass');
            shell.exit(1);
            process.exit();
        }

        if (argv['tls-debug']) {
            console.log('—'.repeat(process.stdout.columns));
            console.log('');
        }

        if (shell.exec('easyrsa --req-cn=ChangeMe build-client-full server1 nopass', { silent: is_silent }).code !== 0) {
            console.log('Error: easyrsa --req-cn=ChangeMe build-client-full server1 nopas');
            shell.exit(1);
            process.exit();
        }

        if (argv['tls-debug']) {
            console.log('—'.repeat(process.stdout.columns));
            console.log('');
        }
    }
};
