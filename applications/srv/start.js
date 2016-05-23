'use strict';

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTczYzU1MjlhY2EzYmI5NjI3MzZkZjQzIiwic3lzdGVtX2lkIjoiNTczZTI3YjIwY2E0NjMyYTJhZWRmYWVhIiwiYXBwX2lkIjoiNTczZTI3ZTdlZWViMTAyYTJhYTY5ZjQ1IiwiaWF0IjoxNDYzNjkxMjM5fQ.V6_PggNS-7XMVmbucC_bCC19rn_WXYklqftQ7xEn4f4"
});

const seneca = require('seneca');
const mesh = require('seneca-mesh');

const service = require('../service');

const opts = {
    seneca: {
        tag: 'applications'
    },
    mesh: {
        auto: true,
        pins: ['role:applications,cmd:*']
    },
    plugin: {

    }
};

seneca(opts.seneca)
    .use(service, opts.plugin)
    .use(mesh, opts.mesh);
