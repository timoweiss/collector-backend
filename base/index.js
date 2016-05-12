'use strict';
require('@risingstack/trace');

// require('shimmingtest').start({application_id: 'base_service', service_name: 'base_service'});


const seneca = require('seneca')({
    tag: 'base'
});

seneca.use('mesh', {base: true});

