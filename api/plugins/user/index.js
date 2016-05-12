'use strict';

const validation = require('./validation');

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

        config: {
            handler: function (request, reply) {
                const seneca = request.server.seneca;
                seneca.act('role:user,cmd:create', request.payload, function (err, data) {
                    if (err) {
                        request.logger.error(err, 'register user');
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let user = request.unwrap(data);

                    if (user.isBoom) {
                        return reply(user);
                    }

                    const sessionData = user;

                    request.cookieAuth.set(sessionData);
                    reply(user);
                });
            },
            validate: {
                payload: validation.register
            },
            description: 'register new user',
            tags: ['api', 'user'],
            auth: false
        }
    });

    next();
};

exports.register.attributes = {
    name: 'user',
    version: '1.0.0'
};