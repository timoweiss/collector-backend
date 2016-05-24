'use strict';


const database = require('./database');

const DATABASENAME = process.env['INFLUXDB_DATABASENAME'] || 'mytestbase';

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
    let timeFrom = args.from || 0;
    let timeTo = args.to;

    let timeClauseFrom = '';
    let timeClauseTo = '';

    if(!timeFrom) {
        timeClauseFrom = 'time > now() - 7d'
    } else {
        timeClauseFrom = `time > '${new Date(timeFrom).toISOString()}'`;
    }

    if(timeTo) {
        timeClauseTo = `AND time < '${new Date(timeTo).toISOString()}'`;
    }

    let timeClause = `WHERE ${timeClauseFrom} ${timeClauseTo}`;

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