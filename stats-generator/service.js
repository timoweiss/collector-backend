'use strict';

const actions = require('./lib/actions');

const defaults = {
    name: 'stats-generator'
};

module.exports = function (options) {

    const seneca = this;
    const extend = seneca.util.deepextend;

    const opts = extend(defaults, options);

    seneca.add({init: opts.name}, function (args, ready) {
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

    seneca.add({role: 'stats', cmd: 'init'}, actions.init);

    return {
        name: opts.name
    };
};
