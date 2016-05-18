'use strict';

const influxdb = require('influx');

const influxClient = influxdb({

    // or single-host configuration
    host: process.env['INFLUXDB_HOST'] || 'localhost',
    port: process.env['INFLUXDB_PORT'] || 8086,
    protocol: process.env['INFLUXDB_PROTOCOL'] || 'http',
    username: process.env['INFLUXDB_USERNAME'] || 'dbuser',
    password: process.env['INFLUXDB_PASSWORD'] || 'f4ncyp4ass',
    database: process.env['INFLUXDB_DATABASENAME'] || 'mytestbase'
});

module.exports = {
    insertPoints,
    rawQuery
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


function rawQuery(queryString) {
    return new Promise((resolve, reject) => {

        influxClient.queryRaw(queryString, (err, result) => {
            if (err) {
                console.log('raw query error:', queryString, err);
                return reject(err);
            }
            resolve(result);
        })
    })
}