'use strict';

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTczYzU1MjlhY2EzYmI5NjI3MzZkZjQzIiwic3lzdGVtX2lkIjoiNTczZTI3YjIwY2E0NjMyYTJhZWRmYWVhIiwiYXBwX2lkIjoiNTczZTI3ZmFlZWViMTAyYTJhYTY5ZjQ4IiwiaWF0IjoxNDYzNjkxMjU4fQ.iKV4m6rWjLJzXoZiNaJ3GuKO5O9GN862jrbG_WyYP-8"
});

const seneca = require('seneca');
const mesh = require('seneca-mesh');

const service = require('../service');

const opts = {
    seneca: {
        tag: 'metrics'
    },
    mesh: {
        auto: true,
        pins: ['role:metrics,cmd:*']
    },
    plugin: {

    }
};

seneca(opts.seneca)
    .use(service, opts.plugin)
    .use(mesh, opts.mesh);
