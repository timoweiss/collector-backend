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

const emptyResponse = {data: {}};

function insertAll(args, callback) {
    // console.log('all metrics:', util.inspect(args, {colors: true, depth: 20}));
    // callback(null, {data: args});
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
        timeseries.push([{
            time: request.timestamp,
            duration: request.duration
        }, {
            name: request.name.replace(',', '|'),
            traceId: request.traceId,
            request_id: request.request_id,
            app_id,
            system_id
        }]);
    });

    console.timeEnd('transforming requests');
    return timeseries;
}