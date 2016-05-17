'use strict';


const database = require('./database');

module.exports = {
    rawQuery
};

function rawQuery(args, callback) {
    const query = args.raw_query;
    database.rawQuery(query)
        .then(result => callback(null, {data: result}))
        .catch(callback);

}

function getServiceStats(args, callback) {
    let fromTime = args.from;
    let services = args.services;
    let queries = [];

    if (typeof services === 'string') {
        services = [services];
    }

    services.map(serviceId => {
        return `SELECT "duration" FROM mytestbase..requests WHERE time > now() - 120m GROUP BY app_id`
    })

    database.rawQuery()
        .then(result => console.log({data: result}))
        .catch(err => console.log('err getServiceStats', err));

    console.log('quering stats for services', services, 'beginning at', fromTime);

    callback(null, {data: {}});
}