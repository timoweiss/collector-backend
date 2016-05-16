'use strict';

const db = require('./database');

module.exports = {
    createSystem,
    createService
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
