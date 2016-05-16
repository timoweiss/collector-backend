'use strict';

const db = require('./database');

module.exports = {
    createSystem
};


function createSystem(args, callback) {

    const nodeData = {
        type: 'System',
        values: {
            name: args.name,
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
