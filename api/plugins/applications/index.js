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
                    role: 'applications',
                    cmd: 'create'
                }, request.requesting_user_id);

                pattern.system_id = request.system_id;

                seneca.act(pattern, request.payload, function (err, data) {

                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    let application = request.unwrap(data);

                    // add node in graph async
                    this.act('role:graphs,cmd:create,type:service', application, function(err, data) {
                        console.log('APPLICATIONS: done creating node-service:', err || data);
                    });

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


    server.route({
        method: 'GET',
        path: '/applications',
        config: {
            handler: function (request, reply) {

                if (!request.system_id) {
                    return reply(request.unwrap({err: {msg: 'MISSING_SYSTEM_ID_SESSION'}}))
                }

                const seneca = request.server.seneca;

                const pattern = request.applyToDefaults({
                    role: 'applications',
                    cmd: 'get'
                }, request.requesting_user_id);

                pattern.system_id = request.system_id;

                let lastSeenData;
                let appData;

                seneca.act('role:metrics,cmd:query,type:lastMemData,by:system', {system_id: request.system_id}, function(err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }
                    lastSeenData = request.unwrap(data);

                    done(reply);

                    console.log('lastMem', lastMem);

                });

                seneca.act(pattern, function (err, data) {

                    if (err) {
                        request.logger.error(err, 'get applications');
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    appData = request.unwrap(data);

                    done(reply);
                });

                function done(reply) {
                    if(lastSeenData && appData) {
                        reply(decorateApplicationsWithUptimeData(appData, lastSeenData));
                    }
                }
            },
            description: 'get applications for current system',
            tags: ['api', 'application']
        }
    });

    next();
};

exports.register.attributes = {
    name: 'applications',
    version: '1.0.0'
};

function decorateApplicationsWithUptimeData(applicationData, uptimeData) {
    applicationData.map(application => {
        application.last_mem_data = 0;
        uptimeData.forEach(ud => {
            if(ud.app_id === application._id) {

                application.last_mem_data = ud.time;
            }
        });
        return application;
    });
    return applicationData;
}