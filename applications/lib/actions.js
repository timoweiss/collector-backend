'use strict';

const database = require('./database');
const jwt = require('jsonwebtoken');

module.exports = {
    createApplication,
    getApplications
};


function createApplication(args, callback) {

    args.created_by = args.ruid;

    let applicationData = {};

    database.createApplication(args)
        .then(response => {
            response.app_token = generateApplicationToken(args.ruid, args.system_id, response._id);
            applicationData = response;
            return response;
        })
        .then(tokenizedResp => database.addApplicationToken(tokenizedResp.app_token, tokenizedResp.app_id))
        .then(() => {
            console.log('db response creating:', applicationData);
            callback(null, {data: applicationData})
        })
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

function generateApplicationToken(ruid, system_id, app_id) {
    return jwt.sign({
        ruid,
        system_id,
        app_id
    }, 'pw');
}