'use strict';

const actions = require('./lib/actions');

const defaults = {
    name: 'metrics'
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
        console.log('bye bye from metrics');
        this.prior(close_msg, done);
    });

    seneca.ready(function(err) {
        console.log(opts.name, err || 'rdy ✓');
    });

    seneca.add({role: 'metrics', cmd: 'insert', type: 'all'}, actions.insertAll);
    seneca.add({role: 'metrics', cmd: 'insert', type: 'loadavg', application_id: '*'}, actions.insertLoadavg);
    seneca.add({role: 'metrics', cmd: 'insert', type: 'request', requests: '*'}, actions.insertRequestMetrics);
    
    seneca.add({role: 'metrics', cmd: 'query', type: 'raw', raw_query: '*'}, actions.rawQuery);
    seneca.add({role: 'metrics', cmd: 'query', type: 'serviceStats', system_id: '*'}, actions.getServiceStats);
    seneca.add({role: 'metrics', cmd: 'query', type: 'serviceStats', by: 'service', app_id: '*'}, actions.getMetricsForService);
    seneca.add({role: 'metrics', cmd: 'query', type: 'lastMemData', by: 'system', system_id: '*'}, actions.getLastMemoryInsertion);

    return {
        name: opts.name
    };
};
