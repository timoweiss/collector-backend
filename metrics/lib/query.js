'use strict';


const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'mytestbase';

// default for the oldest data to retreive
const OLDEST_METRIC_DATA = process.env['OLDEST_METRIC_DATA'] || '7d';

module.exports = {
    rawQuery,
    getServiceStats
};

const INTERVAL = {
    '5m': '6s',
    '10m': '12s',
    '15m': '18s',
    '30m': '36s',
    '1h': '72s',
    '2h': '144s',
    '4h': '5m',
    '12h' : '15m',
    '1d' : '30m',
    '2d' : '60m',
    '3d' : '90m',
    '7d' : '210m'
};

function rawQuery(args, callback) {
    const query = args.raw_query;
    database.rawQuery(query)
        .then(result => callback(null, {data: result}))
        .catch(callback);

}

function getServiceStats(args, callback) {
    let timeFrom = args.from || 0;
    let timeTo = args.to;

    let timeClause = getTimeClause(timeFrom, timeTo);

    let system_id = args.system_id;

    let requestsQueryString = `SELECT COUNT("duration") FROM ${DATABASENAME}..requests ${timeClause} AND system_id = '${system_id}' AND type = 'CS' OR type = 'SR' GROUP BY app_id,type`;
    let memoryQueryString = `SELECT MEAN("heapUsed") FROM ${DATABASENAME}..memory ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`;
    let loadavgQueryString = `SELECT MEAN("value") FROM ${DATABASENAME}..loadavg ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`;


    database.query(`${requestsQueryString}; ${memoryQueryString}; ${loadavgQueryString}`)
        .then(result => {
            callback(null, {
                data: {
                    requests: result[0] || [],
                    memory: result[1] || [],
                    loadavg: result[2] || []
                }
            })
        })
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err)
        });

}


function dateOrNumberToMicroseconds(dateOrNumber) {
    return new Date(dateOrNumber) * 1000;
}

function getTimeClause(timeFrom, timeTo) {
    let timeClauseFrom = '';
    let timeClauseTo = '';

    if(!timeFrom) {
        timeClauseFrom = `time > now() - ${OLDEST_METRIC_DATA}`;
    } else {
        timeClauseFrom = `time > '${new Date(timeFrom).toISOString()}'`;
    }

    if(timeTo) {
        timeClauseTo = `AND time < '${new Date(timeTo).toISOString()}'`;
    }

    return `WHERE ${timeClauseFrom} ${timeClauseTo}`;
}