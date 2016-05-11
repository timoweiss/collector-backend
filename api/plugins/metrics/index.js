'use strict';

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/metrics',
        handler: function (request, reply) {
            reply('user index');
        },
        config: {
            auth: false
        }
    });


    server.route({
        method: 'POST',
        path: '/metrics',
        handler: function (request, reply) {
            reply(request.payload);
        },
        config: {
            auth: false
        }
    });

    next();
};

exports.register.attributes = {
    name: 'metrics',
    version: '1.0.0'
};