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
    rawQuery,
    query,
    createCQfromBuckets,
    createRPfromBuckets
};

function createCQfromBuckets(cqName, cqStatement) {
    //CREATE CONTINUOUS QUERY cq_6s_loadavg ON mytestbase BEGIN SELECT mean(value) as value_mean, median(value) as value_median INTO mytestbase."TEST".downsampled_loadavg FROM mytestbase."default".loadavg GROUP BY time(6s) END
    influxClient.createContinuousQuery(cqName, cqStatement, function (err, res) {
        console.log(err || res);
    })
}

function createRPfromBuckets(buckets) {
    const all = buckets.map(bucket => {
        return new Promise((resolve, reject) => {
            influxClient.createRetentionPolicy(bucket.name, bucket.dbname, bucket.duration, bucket.replication, bucket.isDefault, (err, res) => {
                if(err) {
                    return reject(err);
                }
                resolve(res);
            });
        })
    });
    return Promise.all(all);
}

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

function query(queryString) {
    
    console.log('metrics:queryString', queryString);
    return new Promise((resolve, reject) => {

        influxClient.query(queryString, (err, result) => {
            if (err) {
                console.log('non raw query error:', queryString, err);
                return reject(err);
            }
            resolve(result);
        })
    })
}