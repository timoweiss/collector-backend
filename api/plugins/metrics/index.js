'use strict';

const influxdb = require('influx');
const validation = require('./validation');

const influxClient = influxdb({

    // or single-host configuration
    host: 'localhost',
    port: 8086, // optional, default 8086
    protocol: 'http', // optional, default 'http'
    username: 'dbuser',
    password: 'f4ncyp4ass',
    database: 'mytestbase'
})

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
        path: '/metrics/applications/{id}',

        config: {
            handler: function (request, reply) {

                reply(request.query);

                const timeAg = request.params.time ? encodeURIComponent(request.params.time) : '120s';
                var query = `SELECT mean(value) FROM mytestbase..loadavg WHERE time > 1462997852030000000 GROUP BY time(${timeAg})`;
                //
                //
                // console.time('query');
                // influxClient.queryRaw(query, function (err, results) {
                //     console.timeEnd('query');
                //     reply(err || results);
                //
                // })

                request.server.seneca.act({role: 'metrics', cmd: 'query', type: 'raw', raw_query: query}, function(err, data) {
                    console.log('API: raw query', err || data);
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
        method: 'POST',
        path: '/metrics',
        handler: function (request, reply) {
            // const a = {
            //     requests: [],
            //     osdata: {
            //         loadavg: [[],[]]
            //     },
            //     freemem: 123,
            //     timestamp: 123
            // };
            const seneca = request.server.seneca;

            console.time('acting new metrics');
            seneca.act('role:metrics,cmd:insert,type:all,app_id:' + request.app_id, request.payload, function (err, data) {
                console.timeEnd('acting new metrics');
                console.log('metrics response', err || data)
                reply(err || data);
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