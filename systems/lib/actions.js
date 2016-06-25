'use strict';

const db = require('./database');

module.exports = {
    createSystem,
    getSystems
};


function createSystem(args, callback) {

    args.created_by = args.ruid;

    validateSystemCreation(args.maxSystems, args.ruid)
        .then(() => db.createSystem(args))
        .then(response => callback(null, {data: response}))
        .catch(err => {
            if(err === 'MAX_SYSTEMS_EXCEEDED') {
                return callback(null, {err: err});
            }
            console.log('err creating system:', err);
            callback(err)
        });
}

function getSystems(args, callback) {
    const ruid = args.ruid;

    db.getSystemsByUserId(ruid)
        .then(response => callback(null, {data: response}))
        .catch(callback);
    
}


function validateSystemCreation(allowedSystems, userId) {
    return db.getSystemsByUserId(userId)
        .then(systems => systems.length)
        .then(numExistingSystems => {
            if(numExistingSystems >= allowedSystems) {
                return Promise.reject('MAX_SYSTEMS_EXCEEDED');
            }
            return true;
        });
}