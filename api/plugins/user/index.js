'use strict';

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/users',
        handler: function (request, reply) {
            reply('user index');
        }
    });


    server.route({
        method: 'POST',
        path: '/users',
        handler: function (request, reply) {
            reply('user index');
        }
    });

    next();
};

exports.register.attributes = {
    name: 'user',
    version: '1.0.0'
};