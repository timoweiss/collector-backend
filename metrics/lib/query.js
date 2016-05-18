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
    let requestCs = database.rawQuery(`SELECT COUNT("duration") FROM mytestbase..requests WHERE time > now() - 3h AND system_id = '${system_id}' AND type = 'CS' GROUP BY app_id`)
    let requestSR = database.rawQuery(`SELECT COUNT("duration") FROM mytestbase..requests WHERE time > now() - 3h AND system_id = '${system_id}' AND type = 'SR' GROUP BY app_id`)
    let memory = database.rawQuery(`SELECT MEAN("heapUsed") FROM mytestbase..memory WHERE time > now() - 3h AND system_id = '${system_id}' GROUP BY app_id`)
    let loadavg = database.rawQuery(`SELECT MEAN("value") FROM mytestbase..loadavg WHERE time > now() - 3h AND system_id = '${system_id}' GROUP BY app_id`)
        Promise.all([requestCs, requestSR, memory, loadavg])
        .then(result => callback(null, {data: {
            requests: {
                CS: result[0][0].series,
                SR: result[1][0].series
            },
            memory: result[2][0].series,
            loadavg: result[3][0].series
        }}))
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err)
        });

}
