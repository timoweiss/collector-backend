'use strict';


const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'development';

// default for the oldest data to retreive
const OLDEST_METRIC_DATA = process.env['OLDEST_METRIC_DATA'] || '7d';

module.exports = {
    rawQuery,
    getServiceStats,
    getMetricsForService,
    getLastMemoryInsertion
};

const MAX_POINTS = 50;
const INTERVAL = {
    '5m': 6,
    '10m': 12,
    '15m': 18,
    '30m': 36,
    '1h': 72,
    '2h': 144,
    '4h': 300,
    '12h': 900,
    '1d': 1800,
    '2d': 3600,
    '3d': 5400,
    '7d': 12600
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


    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let bucket = getGroupByClauseAndBucket(timeFrom, timeTo, since).bucket;

    let memQuery = `SELECT mean("rss_mean") as rss_mean, mean("heapTotal_mean") as heapTotal_mean, mean("heapUsed_mean") as heapUsed_mean FROM ${DATABASENAME}."${bucket}".memory WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let loadQuery = `SELECT mean(value_mean) as value_mean, median(value_median) as value_median, percentile(value_percentile_95, 95) as value_percentile_95, percentile(value_percentile_99, 99) as value_percentile_99 FROM ${DATABASENAME}."${bucket}".loadavg WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let requestQuery = `SELECT sum("count") as count, max("max") as max, mean(duration_mean) as duration_mean, median(duration_median) as duration_median, percentile(duration_percentile_95, 95) as duration_percentile_95, percentile(duration_percentile_99, 99) as duration_percentile_99 FROM ${DATABASENAME}."${bucket}".requests WHERE ${timeClause} AND system_id = '${system_id}' AND (type = 'SR' OR type = 'CS') GROUP BY app_id,type fill(0)`;

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

function getLastMemoryInsertion(args, callback) {
    let systemId = args.system_id;
    let lastMemQuery = `SELECT LAST(rss) FROM ${DATABASENAME}..memory WHERE "system_id" = '${systemId}' GROUP BY app_id`;

    database.query(lastMemQuery)
        .then(result => {
            callback(null, {
                data: result[0]
            })
        })
        .catch(err => {
            callback(err);
            console.log('err getLastMemoryInsertion', err)
        });

}

function getMetricsForService(args, callback) {
    let appId = args.app_id;

    let since = args.since;
    let timeFrom = args.from || 0;
    let timeTo = args.to;

    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let groupByClauseAndBucket = getGroupByClauseAndBucket(timeFrom, timeTo, since);
    let bucket = getBucket(timeFrom, timeTo, since);

    let memQuery = `SELECT MEDIAN("heapTotal_mean") as heapTotal, MEDIAN("heapUsed_mean") as heapUsed, MEDIAN("rss_mean") as rss FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".memory WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClauseAndBucket.clause} fill(previous)`;
    let loadQuery = `SELECT MEDIAN("value_median") as median, MEAN("value_mean") as mean, MEAN("value_percentile_95") as percentile_95, MEAN("value_percentile_99") as percentile_99 FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".loadavg WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClauseAndBucket.clause} fill(previous)`;
    let requestQuery = `SELECT MEDIAN("duration") as median, MEAN("duration") as mean, MEAN("duration_percentile_95") as percentile_95, MEAN("duration_percentile_99") as percentile_99 FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".requests WHERE ${timeClause} AND "app_id" = '${appId}' AND type = 'SR' GROUP BY ${groupByClauseAndBucket.clause} fill(previous)`;

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

function getBucket(timeFrom, timeTo, since) {

}

function getGroupByClauseAndBucket(timeFrom, timeTo, since) {

    let bucket;
    let interval;

    if (since && INTERVAL[since]) {
        interval = INTERVAL[since];


    } else {

        timeTo = timeTo || Date.now();
        // calculate the group by values in seconds (eg. 120s)
        interval = Math.floor((new Date(timeTo) - new Date(timeFrom)) / MAX_POINTS / 1000);

    }
    if (interval < 144) {
        bucket = '6sec_bucket';
    } else if (interval < 1800) {
        bucket = '144sec_bucket';
    } else {
        bucket = '30min_bucket';
    }

    return {
        clause: `time(${interval}s)`,
        bucket
    };

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