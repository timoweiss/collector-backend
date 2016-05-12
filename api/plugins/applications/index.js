'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    next();
};

exports.register.attributes = {
    name: 'applications',
    version: '1.0.0'
};