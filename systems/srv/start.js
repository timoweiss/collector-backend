'use strict';

require('dotenv').config();

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTczYzU1MjlhY2EzYmI5NjI3MzZkZjQzIiwic3lzdGVtX2lkIjoiNTczZTI3YjIwY2E0NjMyYTJhZWRmYWVhIiwiYXBwX2lkIjoiNTczZTI3ZjBlZWViMTAyYTJhYTY5ZjQ3IiwiaWF0IjoxNDYzNjkxMjQ4fQ.73IPucQZHkP2YsF_ctazCMb9EnqE5uuwFXIk0CA__KY"
});

const seneca = require('seneca');
const mesh = require('seneca-mesh');

const service = require('../service');

const opts = {
    seneca: {
        tag: 'systems'
    },
    mesh: {
        auto: true,
        pins: ['role:systems,cmd:*']
    },
    plugin: {

    }
};

seneca(opts.seneca)
    .use(service, opts.plugin)
    .use(mesh, opts.mesh);
