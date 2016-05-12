'use strict';

const database = require('./database');
const jwt = require('jsonwebtoken');

module.exports = {
    createApplication,
    getApplications
};


function createApplication(args, callback) {
    args.app_token = jwt.sign({
        ruid: args.ruid,
        system_id: args.system_id
    }, 'pw');

    args.created_by = args.ruid;

    database.createApplication(args)
        .then(response => callback(null, {data: response}))
        .catch(err => {
            console.log(err);
            callback(err);
        });
}

function getApplications(args, callback) {
    database.getApplicationsBySystemId(args.system_id)
        .then(response => callback(null, {data: response}))
        .catch(callback);

}