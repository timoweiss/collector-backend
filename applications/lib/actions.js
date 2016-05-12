'use strict';

const database = require('./database');

module.exports = {
    createApplication,
    getApplications
};


function createApplication(args, callback) {

    args.created_by = args.ruid;

    database.createApplication(args)
        .then(response => callback(null, {data: response}))
        .catch(callback);
}

function getApplications(args, callback) {
    database.getApplicationsBySystemId(args.system_id)
        .then(response => callback(null, {data: response}))
        .catch(callback);

}