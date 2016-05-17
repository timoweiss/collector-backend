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
        console.log('init');
        // do some init work
        setTimeout(ready, 100);
    });

    seneca.add('role:seneca,cmd:close', function (close_msg, done) {
        // do some cleanup or something
        console.log('bye bye from graphs');
        this.prior(close_msg, done);
    });

    seneca.add({role: 'graphs', cmd: 'create', type: 'system'}, actions.createSystem);
    seneca.add({role: 'graphs', cmd: 'create', type: 'service'}, actions.createService);
    seneca.add({role: 'graphs', cmd: 'create', type: 'events', requests: '*'}, actions.createEvent);
    seneca.add({role: 'graphs', cmd: 'get', system_id: '*', from: '*'}, actions.getGraph);

    return {
        name: opts.name
    };
};
