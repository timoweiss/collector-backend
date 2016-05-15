'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/users',
        config: {
            handler: function (request, reply) {
                const seneca = request.server.seneca;
                seneca.act('role:user,cmd:get,by:nothing', request.payload, function (err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let users = request.unwrap(data);

                    if (users.isBoom) {
                        return reply(user);
                    }

                    reply(users);
                });
            },
            description: 'get all users, testing only',
            tags: ['api', 'user'],
            auth: false
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
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let user = request.unwrap(data);

                    request.cookieAuth.set({user: user});
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


    server.route({
        method: 'POST',
        path: '/users/login',

        config: {
            handler: function (request, reply) {
                const seneca = request.server.seneca;
                seneca.act('role:user,cmd:login', request.payload, function (err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let user = request.unwrap(data);

                    request.cookieAuth.set({user: user});
                    reply(user);
                });
            },
            validate: {
                payload: validation.login
            },
            description: 'login user',
            tags: ['api', 'user', 'login'],
            auth: false
        }
    });

    server.route({
        method: 'GET',
        path: '/users/{id}',
        config: {
            description: 'get user by id',
            tags: ['api', 'user'],
            handler: function(request, reply) {
                const pattern = request.applyToDefaults({role: 'user', cmd: 'get', by: 'id'}, request.requesting_user_id);

                request.server.seneca.act(pattern, request.params, function (err, user) {
                    if (err) {

                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    reply(request.unwrap(user));
                });
            },
            validate: {
                params: validation.id
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'user',
    version: '1.0.0'
};