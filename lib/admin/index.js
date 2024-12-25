'use strict';


const path = require('path');

const model = require(path.join(__dirname, '..', '..', 'model', 'index'));


exports.setup = (app, argv) => {
    

    app.get('/admin/', async (req, res) => {
        
        model.event_log().admin_log(res)
    });
    
    
    app.get('/admin/shares', async (req, res) => {
        
        model.share().all_share_files(res, argv)
    });
    
};

