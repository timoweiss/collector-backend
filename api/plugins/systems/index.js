'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'POST',
        path: '/systems',
        config: {
            handler: function (request, reply) {


                request.payload.maxSystems = request.auth.credentials.user.maxSystems;

                const seneca = request.server.seneca;
                const pattern = request.applyToDefaults({role: 'systems', cmd: 'create'}, request.requesting_user_id);

                seneca.act(pattern, request.payload, function (err, data) {

                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let system = request.unwrap(data);


                    // create system in graph async
                    this.act('role:graphs,cmd:create,type:system', system, function(err, data) {
                        console.log('SYSTEM: done creating node-system:', err || data);
                    });


                    const sessionData = request.auth.credentials;

                    // TODO validate system_id
                    sessionData.system_id = system._id;

                    request.cookieAuth.set(sessionData);


                    reply(system);
                });
            },
            validate: {
                payload: validation.createSystem
            },
            description: 'create new system',
            tags: ['api', 'system']
        }
    });

    server.route({
        method: 'GET',
        path: '/systems',
        config: {
            handler: function (request, reply) {

                const seneca = request.server.seneca;
                const pattern = request.applyToDefaults({role: 'systems', cmd: 'get'}, request.requesting_user_id);

                seneca.act(pattern, function (err, data) {
                    if (err) {
                        console.log(err)
                        // request.logger.error(err, 'get systems');
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let system = request.unwrap(data);

                    reply(system);
                });
            },
            description: 'get systems',
            tags: ['api', 'system']
        }
    });


    server.route({
        method: 'POST',
        path: '/systems/select/{id}',
        config: {
            handler: function (request, reply) {

                const sessionData = request.auth.credentials;
                let old = sessionData.system_id;

                // TODO validate system_id
                sessionData.system_id = request.params.id;
                let newCompanyId = sessionData.system_id;

                request.cookieAuth.set(sessionData);
                reply({oldSystemId: old || '', newSystemId: newCompanyId});


            },
            validate: {
                params: validation.id
            },
            description: 'select a system for current session',
            tags: ['api', 'system']
        }
    });

    next();
};

exports.register.attributes = {
    name: 'systems',
    version: '1.0.0'
};