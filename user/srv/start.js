'use strict';
// require('seneca-intercept');
require('@risingstack/trace');

// require('shimmingtest').start({application_id: 'user_service', service_name: 'user_service'});


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
