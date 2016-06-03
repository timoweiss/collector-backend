'use strict';

const actions = require('./lib/actions');
const database = require('./lib/database');

const defaults = {
    name: 'applications'
};

module.exports = function (options) {

    const seneca = this;
    const extend = seneca.util.deepextend;

    const opts = extend(defaults, options);

    seneca.add({init: opts.name}, function (args, ready) {
        database.connect()
            .then(() => {
                console.log('init', opts.name, 'done');
                ready();
            })
            .catch(err => {
                console.error(opts.name, err);
                process.exit(1);
            });
    });

    seneca.add('role:seneca,cmd:close', function (close_msg, done) {
        // do some cleanup or something
        console.log('bye bye from applications');
        this.prior(close_msg, done);
    });

    seneca.ready(function(err) {
        console.log(opts.name, err || 'rdy ✓');
    });

    seneca.add({role: 'applications', cmd: 'create'}, actions.createApplication);
    seneca.add({role: 'applications', cmd: 'get'}, actions.getApplications);
    seneca.add({role: 'applications', cmd: 'insert', type: 'requests', requests: '*'}, actions.addRequestEventData);

    return {
        name: opts.name
    };
};
