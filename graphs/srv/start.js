'use strict';

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTczYzU1MjlhY2EzYmI5NjI3MzZkZjQzIiwic3lzdGVtX2lkIjoiNTczZTI3YjIwY2E0NjMyYTJhZWRmYWVhIiwiYXBwX2lkIjoiNTczZTI3ZWJlZWViMTAyYTJhYTY5ZjQ2IiwiaWF0IjoxNDYzNjkxMjQzfQ.erMtwmGUHBp4yapjG02y8FzH9zf4Ru2_9en511fjQoQ"
});

const seneca = require('seneca');
const mesh = require('seneca-mesh');

const service = require('../service');

const opts = {
    seneca: {
        tag: 'graphs'
    },
    mesh: {
        auto: true,
        pins: ['role:graphs']
    },
    plugin: {

    }
};

seneca(opts.seneca)
    .use(service, opts.plugin)
    .use(mesh, opts.mesh);
