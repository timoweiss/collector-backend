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
        timeClauseFrom = 'time > ' + dateOrNumberToMicroseconds(timeFrom);
    }

    if(timeTo) {
        timeClauseTo = 'AND time < ' + dateOrNumberToMicroseconds(timeTo);
    }

    let timeClause = `WHERE ${timeClauseFrom} ${timeClauseTo}`;

    let system_id = args.system_id;

    // TODO: hardcoded time
    let requestCs = database.rawQuery(`SELECT COUNT("duration") FROM ${DATABASENAME}..requests ${timeClause} AND system_id = '${system_id}' AND type = 'CS' GROUP BY app_id`);
    let requestSR = database.rawQuery(`SELECT COUNT("duration") FROM ${DATABASENAME}..requests ${timeClause} AND system_id = '${system_id}' AND type = 'SR' GROUP BY app_id`);
    let memory = database.rawQuery(`SELECT MEAN("heapUsed") FROM ${DATABASENAME}..memory ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`);
    let loadavg = database.rawQuery(`SELECT MEAN("value") FROM ${DATABASENAME}..loadavg ${timeClause} AND system_id = '${system_id}' GROUP BY app_id`);
    Promise.all([requestCs, requestSR, memory, loadavg])
        .then(result => {
            if (!result[0][0] || !result[0][0].series) {
                console.error(`SELECT COUNT("duration") FROM ${DATABASENAME}..requests ${timeClause} AND system_id = '${system_id}' AND type = 'CS' GROUP BY app_id`)
                console.error(`SELECT COUNT("duration") FROM ${DATABASENAME}..requests ${timeClause} AND system_id = '${system_id}' AND type = 'SR' GROUP BY app_id`)
                console.error('why', result[0]);
            }
            callback(null, {
                data: {
                    requests: {
                        CS: result[0][0].series || [],
                        SR: result[1][0].series || []
                    },
                    memory: result[2][0].series,
                    loadavg: result[3][0].series
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