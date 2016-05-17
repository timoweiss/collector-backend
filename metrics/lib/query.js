'use strict';


const database = require('./database');

module.exports = {
    rawQuery,
    getServiceStats
};

function rawQuery(args, callback) {
    const query = args.raw_query;
    database.rawQuery(query)
        .then(result => callback(null, {data: result}))
        .catch(callback);

}

function getServiceStats(args, callback) {
    let fromTime = args.from;
    let system_id = args.system_id;

    // TODO: hardcoded time, database
    let request = database.rawQuery(`SELECT COUNT("duration") FROM mytestbase..requests WHERE time > now() - 3h AND system_id = '${system_id}' GROUP BY app_id`)
    let memory = database.rawQuery(`SELECT MEAN("heapUsed") FROM mytestbase..memory WHERE time > now() - 3h AND system_id = '${system_id}' GROUP BY app_id`)
    let loadavg = database.rawQuery(`SELECT MEAN("value") FROM mytestbase..loadavg WHERE time > now() - 3h AND system_id = '${system_id}' GROUP BY app_id`)
        Promise.all([request, memory, loadavg])
        .then(result => callback(null, {data: {
            requests: result[0][0].series,
            memory: result[1][0].series,
            loadavg: result[2][0].series
        }}))
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err)
        });

}
