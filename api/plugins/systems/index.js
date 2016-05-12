'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'POST',
        path: '/systems',
        config: {
            handler: function (request, reply) {

                const seneca = request.server.seneca;
                const pattern = request.applyToDefaults({role: 'systems', cmd: 'create'}, request.requesting_user_id);

                seneca.act(pattern, request.payload, function (err, data) {

                    if (err) {
                        request.logger.error(err, 'create system');
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let system = request.unwrap(data);

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

    next();
};

exports.register.attributes = {
    name: 'systems',
    version: '1.0.0'
};