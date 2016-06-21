'use strict';

require('dotenv').config();

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTc1ZWU2MWIyMTMxOTk1NzI3M2I5NTZiIiwic3lzdGVtX2lkIjoiNTc2OWE5ZTM1MWY5NmU0MjI5ZmZhN2I5IiwiYXBwX2lkIjoiNTc2OWFhNDdhZGY5OGU0MjI5YmNiZjRiIiwiaWF0IjoxNDY2NTQyNjYzfQ.rLarEUts2zblXcAat8W6CIQgH0jmV6MBfySK-BZRQS4",
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
