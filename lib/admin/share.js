'use strict';


const path = require('path');

const model = require(path.join(__dirname, '..', '..', 'model', 'index'));


exports.page_index = (app, argv) => {
    

    app.get('/admin/', async (req, res) => {
        
        
        model.share().all_share_files(res, argv)
    });
};

