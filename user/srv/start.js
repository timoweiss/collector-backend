'use strict';

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTc1ZWU2MWIyMTMxOTk1NzI3M2I5NTZiIiwic3lzdGVtX2lkIjoiNTc2OWE5ZTM1MWY5NmU0MjI5ZmZhN2I5IiwiYXBwX2lkIjoiNTc2OWFhNTZhZGY5OGU0MjI5YmNiZjRkIiwiaWF0IjoxNDY2NTQyNjc4fQ.zE2AvDLorC9TYek-LFXunIAfY5WM1YxB4-Z6GK1Vi8Y",
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
