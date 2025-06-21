import os from 'os';
import path from 'node:path';

let config = {};

config.version = 'v3.0.1';
config.defaultPort = 4000;

config.fieldSize_max = 7 * 1024 * 1024 * 1024;
config.fieldSize_max_human = '7 Gb';
config.files_count_max = 200;

config.__rootdir = path.resolve(path.dirname(import.meta.filename) + '/..');

config.homedir = os.homedir();
config.httpup_home = path.join(config.homedir, '.httpup');
config.httpup_thumb = path.join(config.homedir, '.httpup', 'thumb');
config.httpup_temp = path.join(config.homedir, '.httpup', 'temp');
config.httpup_db = path.join(config.homedir, '.httpup', 'db');

config.thumb = {
    IMG: {
        format: ['jpg', 'png', 'gif'],
        min_size: 50 * 1024,
        width: 600,
        quality: 75,
    },
    DOC: {
        format: ['txt', 'pdf', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'ods'],
    },
};

export default config;
