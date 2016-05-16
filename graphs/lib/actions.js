'use strict';

const db = require('./database');

module.exports = {
    createSystem,
    createService,
    createEvent
};


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
                    timestamp: new Date(event.timestamp / 1000),
                    duration: request.duration
                }
            };

            eventNodesData.push(eventObj);
        });
    });
    let promises = eventNodesData.map(event => db.addNode(event));
    Promise.all(promises)
        .then(results => {
            callback(null, {data: {}});
            console.log('results creating eventNodes', results);
        })
        .catch(err => console.error('error creating eventNodes', err));
}
