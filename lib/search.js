import * as urlencode from 'urlencode';

import * as model from '../model/index.js';
import * as util from '../lib/util.js';

export const search_result = (app, argv) => {
    app.get('/__search/', async (req, res) => {
        let req_path = req.path;
        req_path = urlencode.decode(req_path);
        req_path = util.http_path_clear(req_path);

        let readFolder = argv.fold;

        let s = req.query.s;
        s = urlencode.decode(s);

        if (!s || s.length == 0) {
            res.status(500).send(util.error_page_content('500', 'Search param is empty'));
            return;
        }

        model.event_log.write(res, req, 200, 'search', `Open search result page "${s}"`);

        model.file.search_result(res, s);
    });
};
