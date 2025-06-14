import os from 'os';
import path from 'path';

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

export default config;
