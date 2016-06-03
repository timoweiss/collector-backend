'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/metrics/applications/{id}',

        config: {
            handler: function (request, reply) {

                let query = {
                    role: 'metrics',
                    cmd: 'query',
                    type: 'serviceStats',
                    by: 'service',
                    app_id: request.params.id
                };

                request.server.seneca.act(query, request.query, function (err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    reply(request.unwrap(data));
                })


            },
            description: 'get metrics for application id',
            tags: ['api', 'system'],

            validate: {
                query: validation.timeQuery,
                params: validation.id
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/metrics/applications/{id}/loadavg',

        config: {
            handler: function (request, reply) {

                console.log(request.query);

                var query = buildQuery(request, reply, 'value', 'loadavg');

                if (!query) {
                    return;
                }

                request.server.seneca.act({
                    role: 'metrics',
                    cmd: 'query',
                    type: 'raw',
                    raw_query: query
                }, function (err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    reply(request.unwrap(data));

                })


            },
            description: 'select a system for current session',
            tags: ['api', 'system'],

            validate: {
                query: validation.loadQuery,
                params: validation.id
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/metrics/applications/{id}/memory',

        config: {
            handler: function (request, reply) {

                console.log(request.query);

                var query = buildQuery(request, reply, '*', 'memory');

                if (!query) {
                    return;
                }

                request.server.seneca.act({
                    role: 'metrics',
                    cmd: 'query',
                    type: 'raw',
                    raw_query: query
                }, function (err, data) {
                    if (err) {
                        return reply(request.unwrap({err: {msg: 'BAD_IMPL'}}));
                    }

                    reply(request.unwrap(data));

                })


            },
            description: 'select a system for current session',
            tags: ['api', 'system'],

            validate: {
                query: validation.memoryQuery,
                params: validation.id
            }
        }
    });


    server.route({
        method: 'POST',
        path: '/metrics',
        handler: function (request, reply) {

            const seneca = request.server.seneca;

            const payload = request.applyToDefaults(request.payload, {
                app_id: request.app_id,
                system_id: request.system_id
            });

            console.time('acting new metrics');
            seneca.act('role:metrics,cmd:insert,type:all', payload, function (err, data) {
                console.timeEnd('acting new metrics');
                // TODO handling
                reply(err || data);
            });


            addEventsToGraph(seneca, request.payload.requests, request.app_id, request.system_id);




        },
        config: {
            auth: 'jwt'
        }
    });


    const util = require('util')
    const fs = require('fs');

    server.route({
        method: ['POST', 'GET'],
        path: '/api/v1/spans',
        handler: function (request, reply) {
            console.log(util.inspect(request.payload, {colors:true, depth: 20}));

            fs.appendFile('./zipkin.json', JSON.stringify(request.payload), function(err, data) {
                console.log(err || data);
            });
            reply({dank: 'dir'});



        },
        config: {
            auth: false,
            description: 'bla bla test',
            tags: ['api', 'system']
        }
    });


    next()


};

exports.register.attributes = {
    name: 'metrics',
    version: '1.0.0'
};

function addEventsToGraph(seneca, requests, appId, systemId) {

    if(!requests || !requests.length) {
        return;
    }

    seneca.act('role:graphs,cmd:create,type:events', {
        requests: requests,
        app_id: appId,
        system_id: systemId
    }, function (err, data) {
        // TODO handling
        if(err) {
            console.error(err);
        }
    });
}

function buildQuery(request, reply, value, series) {
    let selectorString = value;

    // TODO: refactor this
    if (value === '*' && request.query.aggregate_fn) {
        selectorString = `${request.query.aggregate_fn}(heapTotal) AS heapTotal,
                                ${request.query.aggregate_fn}(heapUsed) AS heapUsed,
                                ${request.query.aggregate_fn}(rss) AS rss`;
    } else {
        selectorString = request.query.aggregate_fn ? `${request.query.aggregate_fn}(${value})` : value;
    }


    let group_byStatement = '';

    if (selectorString !== value) {
        if (!request.query.group_by_value || !request.query.group_by_unit) {
            reply(request.unwrap({err: {msg: 'BAD_QUERY'}}));
            return false;
        }
        group_byStatement = `GROUP BY time(${request.query.group_by_value + request.query.group_by_unit})`
    }

    const period = request.query.period;

    return `SELECT ${selectorString} FROM mytestbase..${series} WHERE time > now() - ${period} AND app_id = '${request.params.id}' ${group_byStatement} fill(0)`;

}