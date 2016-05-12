'use strict';

const actions = require('./lib/actions');
const database = require('./lib/database');

const defaults = {
    name: 'systems'
};

module.exports = function (options) {

    const seneca = this;
    const extend = seneca.util.deepextend;

    const opts = extend(defaults, options);

    seneca.add({init: opts.name}, function (args, ready) {
        // do some init work
        database.connect().then(() => {

            console.log('init', defaults.name, 'done');
            ready()
        });
    });

    seneca.add('role:seneca,cmd:close', function (close_msg, done) {
        // do some cleanup or something
        console.log('bye bye from systems');
        this.prior(close_msg, done);
    });

    seneca.add({role: 'systems', cmd: 'create'}, actions.createSystem);
    seneca.add({role: 'systems', cmd: 'get'}, actions.getSystems);

    return {
        name: opts.name
    };
};
