'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'POST',
        path: '/applications',
        config: {
            handler: function (request, reply) {

                if (!request.system_id) {
                    return reply(request.unwrap({err: {msg: 'MISSING_SYSTEM_ID_SESSION'}}))
                }


                const seneca = request.server.seneca;
                const pattern = request.applyToDefaults({
                    role: 'application',
                    cmd: 'create'
                }, request.requesting_user_id);

                pattern.system_id = request.system_id;

                seneca.act(pattern, request.payload, function (err, data) {

                    if (err) {
                        request.logger.error(err, 'create application');
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let application = request.unwrap(data);

                    reply(application);
                });
            },
            validate: {
                payload: validation.createApplication
            },
            description: 'creates a new application for current system',
            tags: ['api', 'application']
        }
    });

    next();
};

exports.register.attributes = {
    name: 'applications',
    version: '1.0.0'
};