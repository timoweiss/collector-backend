'use strict';


const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'mytestbase';

// default for the oldest data to retreive
const OLDEST_METRIC_DATA = process.env['OLDEST_METRIC_DATA'] || '7d';

module.exports = {
    rawQuery,
    getServiceStats,
    getMetricsForService
};

const MAX_POINTS = 50;
const INTERVAL = {
    '5m': '6s',
    '10m': '12s',
    '15m': '18s',
    '30m': '36s',
    '1h': '72s',
    '2h': '144s',
    '4h': '5m',
    '12h': '15m',
    '1d': '30m',
    '2d': '60m',
    '3d': '90m',
    '7d': '210m'
};

function rawQuery(args, callback) {
    const query = args.raw_query;
    database.rawQuery(query)
        .then(result => callback(null, {data: result}))
        .catch(callback);

}

function getServiceStats(args, callback) {
    let system_id = args.system_id;
    let since = args.since;
    let timeFrom = args.from || 0;
    let timeTo = args.to;


    // let requestsQueryString = `SELECT COUNT("duration") FROM ${DATABASENAME}..requests WHERE ${timeClause} AND system_id = '${system_id}' AND type = 'CS' OR type = 'SR' GROUP BY app_id,type`;
    // let memoryQueryString = `SELECT MEAN("heapUsed") FROM ${DATABASENAME}..memory WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`;
    // let loadavgQueryString = `SELECT MEAN("value") FROM ${DATABASENAME}..loadavg WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`;


    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let groupByClause = getGroupByClause(timeFrom, timeTo, since);

    let memQuery = `SELECT MEDIAN("heapTotal") as heapTotal, MEDIAN("heapUsed") as heapUsed, MEDIAN("rss") as rss FROM ${DATABASENAME}..memory WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let loadQuery = `SELECT MEDIAN("value"), MEAN("value") FROM ${DATABASENAME}..loadavg WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let requestQuery = `SELECT MEDIAN("duration"), MEAN("duration") FROM ${DATABASENAME}..requests WHERE ${timeClause} AND system_id = '${system_id}' AND type = 'SR' GROUP BY app_id fill(0)`;

    let q = `${memQuery}; ${loadQuery}; ${requestQuery};`;


    database.query(q)
        .then(result => {
            callback(null, {
                data: {
                    memory: result[0] || [],
                    loadavg: result[1] || [],
                    requests: result[2] || []
                }
            })
        })
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err)
        });

}

function getMetricsForService(args, callback) {
    let appId = args.app_id;

    let since = args.since;
    let timeFrom = args.from || 0;
    let timeTo = args.to;

    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let groupByClause = getGroupByClause(timeFrom, timeTo, since);

    let memQuery = `SELECT MEDIAN("heapTotal") as heapTotal, MEDIAN("heapUsed") as heapUsed, MEDIAN("rss") as rss FROM ${DATABASENAME}..memory WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClause} fill(0)`;
    let loadQuery = `SELECT MEDIAN("value"), MEAN("value") FROM ${DATABASENAME}..loadavg WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClause} fill(0)`;
    let requestQuery = `SELECT MEDIAN("duration"), MEAN("duration") FROM ${DATABASENAME}..requests WHERE ${timeClause} AND "app_id" = '${appId}' AND type = 'SR' GROUP BY ${groupByClause} fill(0)`;

    let q = `${memQuery}; ${loadQuery}; ${requestQuery};`;


    database.query(q)
        .then(result => {
            let response = {
                memory: result[0] || [],
                load: result[1] || [],
                requests: result[2] || []
            };
            callback(null, {
                data: response
            })
        })
        .catch(err => {
            callback(err);
            console.log('err getMetricsForService', err)
        });
}


function dateOrNumberToMicroseconds(dateOrNumber) {
    return new Date(dateOrNumber) * 1000;
}

function getGroupByClause(timeFrom, timeTo, since) {

    if (since && INTERVAL[since]) {
        return `time(${INTERVAL[since]})`
    }
    timeTo = timeTo || Date.now();

    // calculate the group by values in seconds (eg. 120s)
    let interval = Math.floor((new Date(timeTo) - new Date(timeFrom)) / MAX_POINTS / 1000);

    return `time(${interval}s)`;

}

function getTimeClause(timeFrom, timeTo, since) {
    let timeClauseFrom = '';
    let timeClauseTo = '';

    if (since) {
        return `time > now() - ${since}`;
    }

    if (!timeFrom) {
        timeClauseFrom = `time > now() - ${OLDEST_METRIC_DATA}`;
    } else {
        timeClauseFrom = `time > '${new Date(timeFrom).toISOString()}'`;
    }

    if (timeTo) {
        timeClauseTo = `AND time < '${new Date(timeTo).toISOString()}'`;
    }

    return `${timeClauseFrom} ${timeClauseTo}`;
}