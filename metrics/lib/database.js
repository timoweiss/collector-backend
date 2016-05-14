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
});

module.exports = {
    insertPoints
};

function insertPoints(seriesName, loadData) {
    return new Promise((resolve, reject) => {
        console.time('insert points');
        influxClient.writePoints(seriesName, loadData, {precision: 'u'}, function (err, resp) {
            console.log(err, resp);
            if (err) {
                return reject(err);
            }
            resolve(resp || {});
            console.timeEnd('insert points');
        });
    });
}
