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

const VALUES = {
    low: {
        mem: {
            rss_mean: 'rss',
            heapTotal_mean: 'heapTotal',
            heapUsed_mean: 'heapUsed'
        },
        load: {
            value_mean: 'value',
            value_median: 'value'
        },
        requests: {
            count: 'count("duration")',
            max: 'max("duration")',
            duration_mean: '"duration"',
            duration_median: '"duration"',
            p95: '"duration"',
            p99: '"duration"'
        }
    },
    high: {
        mem: {
            rss_mean: 'rss_mean',
            heapTotal_mean: 'heapTotal_mean',
            heapUsed_mean: 'heapUsed_mean'
        },
        load: {
            value_mean: 'value_mean',
            value_median: 'value_median'
        },
        requests: {
            count: 'sum("count")',
            max: 'max("max")',
            duration_mean: 'duration_mean',
            duration_median: 'duration_median',
            p95: 'duration_percentile_95',
            p99: 'duration_percentile_99'
        }
    }
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


    console.time('getServiceStats ' + system_id);


    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let bucket = getGroupByClauseAndBucket(timeFrom, timeTo, since).bucket;

    let v;

    if (bucket === 'default') {
        v = VALUES.low;
        bucket = '';
    } else {
        v = VALUES.high;
    }

    let memQuery = `SELECT mean(${v.mem.rss_mean}) as rss_mean, mean(${v.mem.heapTotal_mean}) as heapTotal_mean, mean(${v.mem.heapUsed_mean}) as heapUsed_mean FROM ${DATABASENAME}."${bucket}".memory WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let loadQuery = `SELECT mean(${v.load.value_mean}) as value_mean, median(${v.load.value_median}) as value_median FROM ${DATABASENAME}."${bucket}".loadavg WHERE ${timeClause} AND system_id = '${system_id}' GROUP BY app_id fill(0)`;
    let requestQuery = `SELECT ${v.requests.count} as count, ${v.requests.max} as max, mean(${v.requests.duration_mean}) as duration_mean, median(${v.requests.duration_median}) as duration_median, percentile(${v.requests.p95}, 95) as duration_percentile_95, percentile(${v.requests.p99}, 99) as duration_percentile_99 FROM ${DATABASENAME}."${bucket}".requests WHERE ${timeClause} AND system_id = '${system_id}' AND (type = 'SR' OR type = 'CS') GROUP BY app_id,type fill(0)`;

    let q = `${requestQuery};`;


    database.query(q)
        .then(result => {
            callback(null, {
                data: {
                    memory: result[10] || [],
                    loadavg: result[11] || [],
                    requests: result[0] || []
                }
            });
            console.timeEnd('getServiceStats ' + system_id);
        })
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err);
            console.timeEnd('getServiceStats ' + system_id);
        });

}

function getLastMemoryInsertion(args, callback) {
    let systemId = args.system_id;
    let lastMemQuery = `SELECT LAST(rss) FROM ${DATABASENAME}..memory WHERE "system_id" = '${systemId}' GROUP BY app_id`;

    console.time('getLastMemoryInsertion ' + systemId);
    database.query(lastMemQuery)
        .then(result => {
            console.timeEnd('getLastMemoryInsertion ' + systemId);
            callback(null, {
                data: result[0]
            })
        })
        .catch(err => {
            callback(err);
            console.log('err getLastMemoryInsertion', err)
            console.timeEnd('getLastMemoryInsertion ' + systemId);
        });

}

function getMetricsForService(args, callback) {
    let appId = args.app_id;

    let since = args.since;
    let timeFrom = args.from || 0;
    let timeTo = args.to;

    console.time('getMetricsForService ' + appId);

    let timeClause = getTimeClause(timeFrom, timeTo, since);
    let groupByClauseAndBucket = getGroupByClauseAndBucket(timeFrom, timeTo, since);

    let v;

    if (groupByClauseAndBucket.bucket === 'default') {
        v = VALUES.low;
        groupByClauseAndBucket.bucket = '';
    } else {
        v = VALUES.high;
    }

    let memQuery = `SELECT mean(${v.mem.rss_mean}) as rss_mean, mean(${v.mem.heapTotal_mean}) as heapTotal_mean, mean(${v.mem.heapUsed_mean}) as heapUsed_mean FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".memory WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClauseAndBucket.clause} fill(0)`;
    let loadQuery = `SELECT mean(${v.load.value_mean}) as value_mean, median(${v.load.value_median}) as value_median FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".loadavg WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY ${groupByClauseAndBucket.clause} fill(0)`;
    let requestQuery = `SELECT ${v.requests.count} as count, ${v.requests.max} as max, mean(${v.requests.duration_mean}) as duration_mean, median(${v.requests.duration_median}) as duration_median, percentile(${v.requests.p95}, 95) as duration_percentile_95, percentile(${v.requests.p99}, 99) as duration_percentile_99 FROM ${DATABASENAME}."${groupByClauseAndBucket.bucket}".requests WHERE ${timeClause} AND "app_id" = '${appId}' AND (type = 'SR' or type = 'CS') GROUP BY ${groupByClauseAndBucket.clause}, type fill(0)`;
    let startStopQuery = `SELECT * FROM ${DATABASENAME}."".startStop WHERE ${timeClause} AND "app_id" = '${appId}' GROUP BY app_id`;

    console.log('startStopQuery', startStopQuery);

    let q = `${memQuery}; ${loadQuery}; ${requestQuery}; ${startStopQuery};`;


    database.query(q)
        .then(result => {
            let response = {
                memory: result[0] || [],
                load: result[1] || [],
                requests: result[2] || [],
                startStop: result[3] || []
            };
            callback(null, {
                data: response
            });
            console.timeEnd('getMetricsForService ' + appId);
        })
        .catch(err => {
            callback(err);
            console.log('err getMetricsForService', err)
            console.timeEnd('getMetricsForService ' + appId);
        });
}


function dateOrNumberToMicroseconds(dateOrNumber) {
    return new Date(dateOrNumber) * 1000;
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
        bucket = 'default';
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