'use strict';

const db = require('./database');
const helper = require('./helper');

module.exports = {
    createSystem,
    createService,
    createEvent,
    getGraph,
    getGraphByTraceId
};


// TODO: rethink
setInterval(db.findConnectedEventsAndCleanUp, 100000);

function getGraph(args, callback) {
    let systemId = args.system_id;
    let timeFrom = args.from;
    let timeTo = args.to;

    if(!timeFrom) {
        timeTo = 1;
    }

    if (typeof timeFrom !== 'number') {
        timeFrom = new Date(timeFrom).getTime();
    }

    if (timeTo && typeof timeTo !== 'number') {
        timeTo = new Date(timeTo).getTime();
    }

    let serviceStatsP = getServiceStatsForGraph(this, systemId, timeFrom, timeTo);

    let graphP = db.getGraphBySystemId(systemId, timeFrom, timeTo);

    Promise.all([graphP, serviceStatsP])
        .then(results => {

            let transformedGraph = helper.transformGraph(results[0].records, results[1]);

            callback(null, {data: transformedGraph});
        })
        .catch(err => {
            console.error('error retrieving graph for system_id', systemId, err);
            callback(err);
        });
}

function getServiceStatsForGraph(seneca, systemId, timeFrom, timeTo) {
    return new Promise((resolve, reject) => {

        console.time('gettingGraph|stats');

        seneca.act('role:metrics,cmd:query,type:serviceStats', {
            system_id: systemId,
            from: timeFrom || '',
            to: timeTo || ''
        }, (err, data) => {

            console.timeEnd('gettingGraph|stats');
            if (err) {
                return reject(err);
            }
            resolve(data.data);
        });
    });
}

function getGraphByTraceId(args, callback) {
    let systemId = args.system_id;
    let traceId = args.traceId;
    if (!systemId || !traceId) {
        return callback(null, {err: {msg: 'missing systemId or traceId'}});
    }

    db.getGraphByTraceId(systemId, traceId)
        .then(result => callback(null, {data: result}))
        .catch(err => {
            console.error('err getting graph by traceId', err);
            callback(err);
        });

}

function createSystem(args, callback) {

    const nodeData = {
        type: 'System',
        values: {
            name: args.name,
            created_by: args.created_by,
            id: args._id,
            description: args.description
        }
    };

    db.addNode(nodeData)
        .then(result => {
            callback(null, result);
        })
        .catch(callback)
}

function createService(args, callback) {

    const nodeData = {
        type: 'Service',
        values: {
            name: args.name,
            created_by: args.created_by,
            id: args._id,
            description: args.description
        }
    };

    db.addNode(nodeData)
        .then(() => db.addServiceSystemRelation(args._id, args.system_id, 'BELONGS_TO'))
        .then(result => callback(null, {data: result}))
        .catch(err => {
            console.log(err);
            callback(err)
        })
}

function createEvent(args, callback) {
    const eventNodesData = [];
    args.requests.forEach(request => {
        request.annotations.forEach(event => {
            let eventObj = {
                type: event.value.toUpperCase(),
                values: {
                    requestId: request.request_id,
                    traceId: request.traceId,
                    appId: args.app_id,
                    name: request.name,
                    timestamp: event.timestamp / 1000,
                    duration: request.duration
                }
            };

            eventNodesData.push(eventObj);
        });
    });
    let promises = eventNodesData.map(event => db.addNode(event));
    Promise.all(promises)
        .then(() => {
            callback(null, {data: {}});
        })
        .catch(err => console.error('error creating eventNodes', err));
}
