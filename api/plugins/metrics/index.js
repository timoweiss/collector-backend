'use strict';

const influxdb = require('influx');

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

    server.route({
        method: 'GET',
        path: '/metrics/{time?}',
        handler: function (request, reply) {
            const timeAg = request.params.time ? encodeURIComponent(request.params.time) : '120s';
            var query = `SELECT mean(value) FROM mytestbase..loadavg WHERE time > 1462997852030000000 GROUP BY time(${timeAg})`;


            console.time('query');
            influxClient.queryRaw(query, function(err, results) {
                console.timeEnd('query');
                reply(err || results);

            })

        },
        config: {
            auth: false
        }
    });


    server.route({
        method: 'POST',
        path: '/metrics',
        handler: function (request, reply) {
            // console.log(request.payload.osdata.loadavg)
            request.payload.osdata.loadavg.forEach(obj => {
                console.log(obj)
                influxClient.writePoint('loadavg', obj, null, function(err, resp) {
                    console.log(err, resp);
                })

            });


            reply(request.payload.osdata.loadavg);
        },
        config: {
            auth: false
        }
    });

    next();
};

exports.register.attributes = {
    name: 'metrics',
    version: '1.0.0'
};