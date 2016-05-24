'use strict';


const database = require('./database');
const query = require('./query');

module.exports = {
    insertLoadavg,
    insertMemory,
    insertAll,
    insertRequestMetrics,
    rawQuery: query.rawQuery,
    getServiceStats: query.getServiceStats
};

const INTERVAL = {
    '5m': '6s',
    '10m': '12s',
    '15m': '18s',
    '30m': '36s',
    '1h': '72s',
    '2h': '144s',
    '4h': '5m',
    '12h' : '15m',
    '1d' : '30m',
    '2d' : '60m',
    '3d' : '90m',
    '7d' : '210m'
};

const emptyResponse = {data: {}};

function insertAll(args, callback) {


    let loadP = insertLoadavg({loadavg: args.osdata.loadavg, app_id: args.app_id, system_id: args.system_id});
    let memP = insertMemory({memory: args.osdata.memory, app_id: args.app_id, system_id: args.system_id});
    let requestsP = insertRequestMetrics({requests: args.requests, app_id: args.app_id, system_id: args.system_id});
    console.log(args.app_id);

    Promise.all([loadP, memP, requestsP])
        .then(results => callback(null, {data: {loadavg: results[0].data, memory: results[1].data, requests: results[2].data}}))
        .catch(callback);

}


function insertLoadavg(args, callback) {

    callback = callback || () => {
        };


    if(!args.loadavg.length) {
        callback(null, emptyResponse);
        return emptyResponse;
    }

    const loadavg = args.loadavg.map(point => [point, {app_id: args.app_id, system_id: args.system_id}]);

    return database.insertPoints('loadavg', loadavg)
        .then(() => {
            callback(null, emptyResponse);
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

    if(!args.memory.length) {
        callback(null, emptyResponse);
        return emptyResponse;
    }

    const memory = args.memory.map(point => [{
        rss: point.value.rss,
        heapTotal: point.value.heapTotal,
        heapUsed: point.value.heapUsed,
        time: point.time
    }, {app_id: args.app_id, system_id: args.system_id}]);


    return database.insertPoints('memory', memory)
        .then(() => {
            callback(null, emptyResponse);
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

    if(!args.requests.length) {
        callback(null, emptyResponse);
        return emptyResponse;
    }

    let requestMetrics = buildTimeseriesFromRequests(args.requests, args.app_id, args.system_id);

    return database.insertPoints('requests', requestMetrics)
        .then(() => {
            callback(null, emptyResponse);
            return true;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}



function buildTimeseriesFromRequests(requests, app_id, system_id) {
    const timeseries = [];
    console.time('transforming requests');
    requests.forEach(request => {
        request.annotations.forEach(event => {
            timeseries.push([{
                time: event.timestamp,
                duration: request.duration
            }, {
                name: request.name.replace(',', '|'),
                traceId: request.traceId,
                request_id: request.request_id,
                type: event.value.toUpperCase(),
                app_id,
                system_id
            }]);
        });
    });

    console.timeEnd('transforming requests');
    return timeseries;
}