'use strict';

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
