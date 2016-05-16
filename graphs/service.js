'use strict';

const actions = require('./lib/actions');

const defaults = {
    name: 'service'
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

    seneca.add({role: 'graphs', cmd: 'action1'}, actions.serviceAction);
    seneca.add({role: 'graphs', cmd: 'action2'}, actions.serviceAction2);

    return {
        name: opts.name
    };
};
