import os from 'os';
import path from 'path';

let config = {};

config.version = 'v3.0.0';
config.defaultPort = 4000;

config.fieldSize_max = 7 * 1024 * 1024 * 1024;
config.fieldSize_max_human = '7 Gb';
config.files_count_max = 200;

config.__rootdir = path.resolve(path.dirname(import.meta.filename) + '/..');

config.homedir = os.homedir();
config.httpup_home = path.join(config.homedir, '.httpup3');
config.httpup_thumb = path.join(config.homedir, '.httpup3', 'thumb');
config.httpup_temp = path.join(config.homedir, '.httpup3', 'temp');
config.httpup_db = path.join(config.homedir, '.httpup3', 'db');

export default config;
