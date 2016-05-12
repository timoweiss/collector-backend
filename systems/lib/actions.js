'use strict';

const db = require('./database');

module.exports = {
    createSystem,
    getSystems
};


function createSystem(args, callback) {

    args.created_by = args.ruid;

    db.createSystem(args)
        .then(response => callback(null, {data: response}))
        .catch(err => callback(err));
}

function getSystems(args, callback) {
    const ruid = args.ruid;

    db.getSystemsByUserId(ruid)
        .then(response => callback(null, {data: response}))
        .catch(callback);
    
}