'use strict';

require('dotenv').config();

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTc1ZWU2MWIyMTMxOTk1NzI3M2I5NTZiIiwic3lzdGVtX2lkIjoiNTc2OWE5ZTM1MWY5NmU0MjI5ZmZhN2I5IiwiYXBwX2lkIjoiNTc2OWFhMmVhZGY5OGU0MjI5YmNiZjQ5IiwiaWF0IjoxNDY2NTQyNjM4fQ.HJ7XMZ7DzzNUNJ0DsDUMAEkvyKu0aWzvwJ5v1Y8Vfjo",
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
