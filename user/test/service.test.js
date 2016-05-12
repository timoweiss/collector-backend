'use strict';

const test = require('ava');

const seneca = require('seneca')();
const service = require('../service');

test.before.cb(t => {
    seneca.use(service);
    seneca.ready(function() {
        t.end();
    });
});


test.cb('action login', t => {

    t.plan(4);

    seneca.act({role: 'user', cmd: 'login'}, function (err, result) {

        t.is(err, null);
        t.truthy(result.err);
        t.truthy(result.err.msg);
        t.is(result.err.msg, 'LOGIN_NOT_FOUND');

        t.end();
    });
});
