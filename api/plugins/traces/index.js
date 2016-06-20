'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/traces',
        config: {
            handler: function (request, reply) {

                if (!request.system_id) {
                    return reply(request.unwrap({err: {msg: 'MISSING_SYSTEM_ID_SESSION'}}))
                }

                let query = {
                    system_id: request.system_id
                };

                Object.assign(query, request.query);
                console.log('get traces query', query);

                console.time('getting traces');
                request.server.seneca.act('role:graphs,cmd:get,type:traces', query, function (err, data) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }

                    let graphData = request.unwrap(data);

                    reply(graphData);
                    console.timeEnd('getting traces');
                });


            },
            description: 'get the recent traces for current selected system',
            tags: ['api', 'system', 'trace'],
            validate: {
                query: validation.timeQuery
            }
        }
    });



    server.route({
        method: 'GET',
        path: '/traces/{id}',
        config: {
            handler: function (request, reply) {

                if (!request.system_id) {
                    return reply(request.unwrap({err: {msg: 'MISSING_SYSTEM_ID_SESSION'}}))
                }

                let query = {
                    system_id: request.system_id,
                    traceId: request.params.id
                };
                console.log();

                console.time('gettingGraph for traceid');
                request.server.seneca.act('role:graphs,cmd:get', query, function (err, data) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }

                    let graphData = request.unwrap(data);

                    reply(graphData);
                    console.timeEnd('gettingGraph for traceid');
                });


            },
            description: 'get the network graph for selected trace id',
            tags: ['api', 'system', 'graph', 'trace'],
            validate: {
                params: validation.id
            }
        }
    });



    next();
};

exports.register.attributes = {
    name: 'traces',
    version: '1.0.0'
};