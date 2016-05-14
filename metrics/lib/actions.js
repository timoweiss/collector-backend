'use strict';


const database = require('./database');
const query = require('./query');

module.exports = {
    insertLoadavg,
    insertMemory,
    insertAll,
    insertRequestMetrics,
    rawQuery: query.rawQuery
};

function insertAll(args, callback) {
    // console.log('all metrics:', util.inspect(args, {colors: true, depth: 20}));
    // callback(null, {data: args});
    let loadP = insertLoadavg({loadavg: args.osdata.loadavg, app_id: args.app_id});
    let memP = insertMemory({memory: args.osdata.memory, app_id: args.app_id});
    console.log(args.app_id);

    Promise.all([loadP, memP])
        .then(results => callback(null, {data: {loadavg: results[0].data, memory: results[1].data}}))
        .catch(callback);

}


function insertLoadavg(args, callback) {

    callback = callback || () => {
        };

    const loadavg = args.loadavg.map(point => [point, {app_id: args.app_id}]);

    return database.insertPoints('loadavg', loadavg)
        .then(() => {
            callback(null, {data: {}});
            return true;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}

function insertMemory(args, callback) {

    callback = callback || () => {
        };

    const memory = args.memory.map(point => [{
        rss: point.value.rss,
        heapTotal: point.value.heapTotal,
        heapUsed: point.value.heapUsed,
        time: point.time
    }, {app_id: args.app_id}]);


    return database.insertPoints('memory', memory)
        .then(() => {
            callback(null, {data: {}});
            return true;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}

function insertRequestMetrics(args, callback) {
    callback = callback || () => {
        };

    return database.insertPoints('requests', args.request_metrics)
        .then(() => {
            callback(null, {data: {}});
            return true;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}