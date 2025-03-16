

'use strict';

const path = require('path');










const all_share_ = require(path.join(__dirname, 'api', 'all_share'));

exports.all_share = (app, argv) => {
    return all_share_.all_share(app, argv)
};


const get_all_ = require(path.join(__dirname, 'api', 'get_all'));

exports.get_all = (app, argv) => {
    return get_all_.get_all(app, argv)
};



const post_file_upload_ = require(path.join(__dirname, 'api', 'post_file_upload'));

exports.post_file_upload = (app, argv) => {
    return post_file_upload_.post_file_upload(app, argv)
};


const post_folder_ = require(path.join(__dirname, 'api', 'post_folder'));

exports.post_folder = (app, argv) => {
    return post_folder_.post_folder(app, argv)
};


const post_file_touch_ = require(path.join(__dirname, 'api', 'post_file_touch'));

exports.post_file_touch = (app, argv) => {
    return post_file_touch_.post_file_touch(app, argv)
};


const post_delete_ = require(path.join(__dirname, 'api', 'post_delete'));

exports.post_delete = (app, argv) => {
    return post_delete_.post_delete(app, argv)
};




const post_move_ = require(path.join(__dirname, 'api', 'post_move'));

exports.post_move = (app, argv) => {
    return post_move_.post_move(app, argv)
};




const post_copy_ = require(path.join(__dirname, 'api', 'post_copy'));

exports.post_copy = (app, argv) => {
    return post_copy_.post_copy(app, argv)
};



const post_zip_ = require(path.join(__dirname, 'api', 'post_zip'));

exports.post_zip = (app, argv) => {
    return post_zip_.post_zip(app, argv)
};



const post_rename_ = require(path.join(__dirname, 'api', 'post_rename'));

exports.post_rename = (app, argv) => {
    return post_rename_.post_rename(app, argv)
};





