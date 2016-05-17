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
    database.rawQuery(`SELECT COUNT("duration") FROM mytestbase..requests WHERE time > now() - 1h AND system_id = '${system_id}' GROUP BY app_id`)
        .then(result => callback(null, {data: result}))
        .catch(err => {
            callback(err);
            console.log('err getServiceStats', err)
        });

}
