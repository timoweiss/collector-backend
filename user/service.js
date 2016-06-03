'use strict';

const actions = require('./lib/actions');
const database = require('./lib/database');

const defaults = {
    name: 'user'
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
            })
    });

    seneca.add('role:seneca,cmd:close', function (close_msg, done) {
        // do some cleanup or something
        console.log('bye bye from', opts.name);
        this.prior(close_msg, done);
    });

    seneca.ready(function (err) {
        console.log(err || 'plugin ready:', opts.name);
    });

    seneca.add({role: 'user', cmd: 'create'}, actions.createUser);
    seneca.add({role: 'user', cmd: 'login'}, actions.loginUser);
    seneca.add({role: 'user', cmd: 'get', by: 'nothing'}, actions.getAllUser);
    seneca.add({role: 'user', cmd: 'get', by: 'id', id: '*'}, actions.getUserById);

    // seneca.act({role: 'user', cmd: 'get', by: 'id', id: 'e76d1ac9-bae0-4814-a19d-566547e8c92c'}, console.log);

    return {
        name: opts.name
    };
};
