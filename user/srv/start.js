'use strict';
require('dotenv').config();

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTczYzU1MjlhY2EzYmI5NjI3MzZkZjQzIiwic3lzdGVtX2lkIjoiNTczZTI3YjIwY2E0NjMyYTJhZWRmYWVhIiwiYXBwX2lkIjoiNTczZTI3ZTJlZWViMTAyYTJhYTY5ZjQ0IiwiaWF0IjoxNDYzNjkxMjM0fQ.MuM3Z2xs7_QSVclpXq4pSvVHBv6la-r99UqpW6R9dOE"
});

const seneca = require('seneca');
const mesh = require('seneca-mesh');

const service = require('../service');

const opts = {
    seneca: {
        tag: 'user',
        strict:{result:false}
    },
    mesh: {
        auto: true,
        pins: ['role:user,cmd:*']
    },
    plugin: {

    }
};

seneca(opts.seneca)
    .use(service, opts.plugin)
    .use(mesh, opts.mesh);
