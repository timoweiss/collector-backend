'use strict';

const test = require('ava');

const seneca = require('seneca')();
const service = require('../service');

test.before(t => {
    seneca.use(service);
});

test('action1 test', t => {

    seneca.act({role: 'graphs', cmd: 'action1'}, function (err, result) {
        t.equal(err, null);
    });
});

test('action2 test', t => {

    seneca.act({role: 'graphs', cmd: 'action2'}, function (err, result) {
        t.equal(err, null);
        t.is('data', result.data);
    });
});
