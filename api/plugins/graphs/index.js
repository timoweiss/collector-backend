'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {


    server.route({
        method: 'GET',
        path: '/graphs',
        config: {
            handler: function (request, reply) {

                if (!request.system_id) {
                    return reply(request.unwrap({err: {msg: 'MISSING_SYSTEM_ID_SESSION'}}))
                }

                request.query.system_id = request.system_id;

                console.time('gettingGraph');
                request.server.seneca.act('role:graphs,cmd:get', request.query, function (err, data) {
                    if (err) {
                        return reply(err);
                    }

                    let graphData = request.unwrap(data);

                    reply(graphData);
                    console.timeEnd('gettingGraph');
                });


            },
            description: 'get the network graph for the currently selected system',
            tags: ['api', 'system', 'graph'],
            validate: {
                query: validation.getGraphQuery
            }
        }
    });


    server.route({
        method: 'GET',
        path: '/graphs/traces/{id}',
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
    name: 'graphs',
    version: '1.0.0'
};
