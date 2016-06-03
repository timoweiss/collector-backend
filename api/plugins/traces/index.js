'use strict';

exports.register = (server, options, next) => {

    next();
};

exports.register.attributes = {
    name: 'traces',
    version: '1.0.0'
};