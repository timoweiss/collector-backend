'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {


    server.register(require('hapi-auth-jwt2'), function (err) {
        if (err) {
            throw err;
        }

        server.auth.strategy('jwt', 'jwt', {
            key: 'pw',          // Never Share your secret key
            validateFunc: function (decoded, request, callback) {

                request.app_id = decoded.app_id;

                callback(null, true);
            },            // validate function defined above
            verifyOptions: {algorithms: ['HS256']} // pick a strong algorithm
        });


        next();

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

            console.time('acting new metrics');
            seneca.act('role:metrics,cmd:insert,type:all,app_id:' + request.app_id, request.payload, function (err, data) {
                console.timeEnd('acting new metrics');
                console.log('metrics load/memory response', err || data)
                reply(err || data);
            });


            const request_metrics = buildTimeseriesFromRequests(request.payload.requests, request.app_id)
            seneca.act('role:metrics,cmd:insert,type:request,app_id:' + request.app_id, {request_metrics: request_metrics}, function (err, data) {

                console.log('metrics requests response', err || data)

            });


        },
        config: {
            auth: 'jwt'
        }
    });
};

exports.register.attributes = {
    name: 'metrics',
    version: '1.0.0'
};

function buildQuery(request, reply, value, series) {

    const selectorString = request.query.aggregate_fn ? `${request.query.aggregate_fn}(${value})` : value;
    let group_byStatement = '';

    if (selectorString !== value) {
        if (!request.query.group_by_value || !request.query.group_by_unit) {
            reply(request.unwrap({err: {msg: 'BAD_QUERY'}}));
            return false;
        }
        group_byStatement = `GROUP BY time(${request.query.group_by_value + request.query.group_by_unit})`
    }

    const period = request.query.period;

    return `SELECT ${selectorString} FROM mytestbase..${series} WHERE time > now() - ${period} AND app_id = '${request.params.id}' ${group_byStatement}`;

}


function buildTimeseriesFromRequests(requests, app_id) {
    const timeseries = [];
    console.time('transforming requests');
    requests.forEach(request => {
        timeseries.push([{
            time: request.timestamp,
            duration: request.duration

        }, {
            name: request.name.replace(',', '|'),
            traceId: request.traceId,
            request_id: request.request_id,
            app_id
        }]);
    });

    console.timeEnd('transforming requests');
    return timeseries;

}