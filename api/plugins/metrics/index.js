'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {

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
                console.log('metrics load/memory response', err || data);
                reply(err || data);
            });


            seneca.act('role:graphs,cmd:create,type:events', {
                requests: request.payload.requests,
                app_id: request.app_id,
                system_id: request.system_id
            }, function (err, data) {
                console.log('METRICs: done creating node-event:', err || data);
            });

            // seneca.act({role: 'applications', cmd: 'insert', type: 'requests'}, {
            //     requests: request.payload.requests,
            //     app_id: request.app_id
            // }, function (err, data) {
            //     console.log('MONGOINSERT:', err || data);
            // })


        },
        config: {
            auth: 'jwt'
        }
    });

    next()


};

exports.register.attributes = {
    name: 'metrics',
    version: '1.0.0'
};

function buildQuery(request, reply, value, series) {
    let selectorString = '';

    // TODO: refactor this
    if(series === 'memory') {
        selectorString = `${request.query.aggregate_fn}(rss),${request.query.aggregate_fn}(heapTotal), ${request.query.aggregate_fn}(heapUsed)`;
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

    return `SELECT ${selectorString} FROM mytestbase..${series} WHERE time > now() - ${period} AND app_id = '${request.params.id}' ${group_byStatement}`;

}