'use strict';

const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'development';

const DOWNSAMPLED_CQS = [{
    name: 'cq_6s_loadavg',
    from: 'default',
    source_name: 'loadavg',
    into: '6sec_bucket',
    downsampled_name: 'loadavg',
    interval: '6s',
    select_stmt: 'SELECT mean(value) as value_mean, median(value) as value_median, percentile(value, 95) as value_percentile_95, percentile(value, 99) as value_percentile_99'
}, {
    name: 'cq_144s_loadavg',
    from: '6sec_bucket',
    source_name: 'loadavg',
    into: '144sec_bucket',
    downsampled_name: 'loadavg',
    interval: '144s',
    select_stmt: 'SELECT mean(value_mean) as value_mean, median(value_median) as value_median, percentile(value_percentile_95, 95) as value_percentile_95, percentile(value_percentile_99, 99) as value_percentile_99'
}, {
    name: 'cq_30m_loadavg',
    from: '144sec_bucket',
    source_name: 'loadavg',
    into: '30min_bucket',
    downsampled_name: 'loadavg',
    interval: '30m',
    select_stmt: 'SELECT mean(value_mean) as value_mean, median(value_median) as value_median, percentile(value_percentile_95, 95) as value_percentile_95, percentile(value_percentile_99, 99) as value_percentile_99'
}, {
    name: 'cq_6s_requests',
    from: 'default',
    source_name: 'requests',
    into: '6sec_bucket',
    downsampled_name: 'requests',
    interval: '6s',
    select_stmt: 'SELECT mean("duration") as duration_mean, median("duration") as duration_median, percentile("duration", 95) as duration_percentile_95, percentile("duration", 99) as duration_percentile_99'
}, {
    name: 'cq_144s_requests',
    from: '6sec_bucket',
    source_name: 'requests',
    into: '144sec_bucket',
    downsampled_name: 'requests',
    interval: '144s',
    select_stmt: 'SELECT mean(duration_mean) as duration_mean, median(duration_median) as duration_median, percentile(duration_percentile_95, 95) as duration_percentile_95, percentile(duration_percentile_99, 99) as duration_percentile_99'
}, {
    name: 'cq_30m_requests',
    from: '144sec_bucket',
    source_name: 'requests',
    into: '30min_bucket',
    downsampled_name: 'requests',
    interval: '30m',
    select_stmt: 'SELECT mean(duration_mean) as duration_mean, median(duration_median) as duration_median, percentile(duration_percentile_95, 95) as duration_percentile_95, percentile(duration_percentile_99, 99) as duration_percentile_99'
}];

const RP_BUCKETS = [{
    name: '6sec_bucket',
    dbname: DATABASENAME,
    duration: '7d',
    replication: 1,
    isDefault: false
}, {
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