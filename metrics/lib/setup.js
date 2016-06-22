'use strict';

const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'development';

const DOWNSAMPLED_CQS = [{
    name: 'cq_144s_loadavg',
    from: 'default',
    source_name: 'loadavg',
    into: '144sec_bucket',
    downsampled_name: 'loadavg',
    interval: '144s',
    select_stmt: 'SELECT mean(value) as value_mean, median(value) as value_median, percentile(value, 95) as value_percentile_95, percentile(value, 99) as value_percentile_99'
}, {
    name: 'cq_30m_loadavg',
    from: '144sec_bucket',
    source_name: 'loadavg',
    into: '30min_bucket',
    downsampled_name: 'loadavg',
    interval: '30m',
    select_stmt: 'SELECT mean(value_mean) as value_mean, median(value_median) as value_median, percentile(value_percentile_95, 95) as value_percentile_95, percentile(value_percentile_99, 99) as value_percentile_99'
}, {
    name: 'cq_144s_requests',
    from: 'default',
    source_name: 'requests',
    into: '144sec_bucket',
    downsampled_name: 'requests',
    interval: '144s',
    // groupBy: 'type',
    select_stmt: 'SELECT count("duration") as count, max("duration") as max_duration, mean("duration") as duration_mean, median("duration") as duration_median, percentile("duration", 95) as duration_percentile_95, percentile("duration", 99) as duration_percentile_99'
}, {
    name: 'cq_30m_requests',
    from: '144sec_bucket',
    source_name: 'requests',
    into: '30min_bucket',
    downsampled_name: 'requests',
    interval: '30m',
    // groupBy: 'type',
    select_stmt: 'SELECT sum("count") as count, max("max_duration") as max_duration, mean(duration_mean) as duration_mean, median(duration_median) as duration_median, percentile(duration_percentile_95, 95) as duration_percentile_95, percentile(duration_percentile_99, 99) as duration_percentile_99'
}, {
    name: 'cq_144s_memory',
    from: 'default',
    source_name: 'memory',
    into: '144sec_bucket',
    downsampled_name: 'memory',
    interval: '144s',
    select_stmt: 'SELECT mean("rss") as rss_mean, mean("heapTotal") as heapTotal_mean, mean("heapUsed") as heapUsed_mean'
}, {
    name: 'cq_30m_memory',
    from: '144sec_bucket',
    source_name: 'memory',
    into: '30min_bucket',
    downsampled_name: 'memory',
    interval: '30m',
    select_stmt: 'SELECT mean("rss_mean") as rss_mean, mean("heapTotal_mean") as heapTotal_mean, mean("heapUsed_mean") as heapUsed_mean'
}];

const RP_BUCKETS = [{
    name: '144sec_bucket',
    dbname: DATABASENAME,
    duration: '7d',
    replication: 1,
    isDefault: false
}, {
    name: '30min_bucket',
    dbname: DATABASENAME,
    duration: '7d',
    replication: 1,
    isDefault: false
}];

function setup() {
    return database.createDatabase(DATABASENAME)
        .then(res => database.createRPFromBuckets(RP_BUCKETS, DATABASENAME))
        .then(() => database.createCQFromBuckets(DOWNSAMPLED_CQS, DATABASENAME))
        .then(res => {
            console.log('successfully created RPs+CQs');
            return res;
        });
}

module.exports = setup;