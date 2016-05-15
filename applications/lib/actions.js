'use strict';

const database = require('./database');
const jwt = require('jsonwebtoken');

module.exports = {
    createApplication,
    getApplications,
    addRequestEventData,
    getGraphBySystemId
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
        .then(tokenizedResp => database.addApplicationToken(tokenizedResp.app_token, tokenizedResp._id))
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

function addRequestEventData(args, callback) {
    args.requests.forEach(event => {
        /*
         {
             "traceId": "ddb50d8c-0adc-4d28-806e-aed5b60ba16b",
             "request_id": "9f5115a1-9ecd-4d69-bbe8-1b77e8a88fe9",
             "timestamp": 1463257767792575,
             "duration": 3371261,
             "name": "{cmd:somethingelse,role:service2}",
             "annotations": [{
                 "endpoint": {
                     "application_id": "applicationid_service",
                     "service_name": "service_service",
                     "process_info": {
                         "pid": 14433
                     }
                 },
                 "value": "cs",
                 "timestamp": 1463257767792575
             }, {
                "endpoint": {
                     "application_id": "applicationid_service",
                     "service_name": "service_service",
                     "process_info": {
                         "pid": 14433
                     }
                 },
                 "value": "cr",
                 "wasLocal": false,
                 "timestamp": 1463257771163836
             }]
         }
         */
        // add app_id that we know from whom the event was reported
        event.app_id = args.app_id;
    });

    database.insertRequestEvents(args.requests)
        .then(() => callback(null, {data: {}}))
        .catch(err => callback(err));

}

function getGraphBySystemId(args, callback) {
    database.getApplicationsBySystemId(args.system_id)
        .then(applications => applications.map(app => {
            return database.findEventsByTypeAndApplicationId('cs', app._id.toString())
        }))
        .then(clientStartRequestEvents => {
            return Promise.all(clientStartRequestEvents);
        })
        .then(results => {

            console.log('clientStartRequestEvents', results);
            callback(null, {data: results})
        })
}


function generateApplicationToken(ruid, system_id, app_id) {
    return jwt.sign({
        ruid,
        system_id,
        app_id
    }, 'pw');
}