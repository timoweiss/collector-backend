'use strict';

const actions = require('./lib/actions');

const defaults = {
    name: 'graphs'
};

module.exports = function (options) {

    const seneca = this;
    const extend = seneca.util.deepextend;

    const opts = extend(defaults, options);

    seneca.add({init: opts.name}, function (args, ready) {
        console.log('init', opts.name, 'done');
        ready();

    });

    seneca.add('role:seneca,cmd:close', function (close_msg, done) {
        // do some cleanup or something
        console.log('bye bye from', opts.name);
        this.prior(close_msg, done);
    });

    seneca.ready(function(err) {
        console.log(opts.name, err || 'rdy ✓');
    });

    seneca.add({role: 'graphs', cmd: 'create', type: 'system'}, actions.createSystem);
    seneca.add({role: 'graphs', cmd: 'create', type: 'service'}, actions.createService);
    seneca.add({role: 'graphs', cmd: 'create', type: 'events', requests: '*'}, actions.createEvent);
    seneca.add({role: 'graphs', cmd: 'get', system_id: '*'}, actions.getGraph);
    seneca.add({role: 'graphs', cmd: 'get', system_id: '*', traceId: '*'}, actions.getGraphByTraceId);

    return {
        name: opts.name
    };
};
