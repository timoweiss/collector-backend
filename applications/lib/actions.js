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

    console.time('buildingGraph');

    const map = [];

    const nodes = [];

    database.getApplicationsBySystemId(args.system_id)
        .then(applications => applications.map(app => {
            map.push(app._id.toString());
            nodes.push(app);
            console.log('adding requestEvents', map);
            let csPromise = database.findEventsByTypeAndApplicationId('cs', app._id.toString());
            let srPromise = database.findEventsByTypeAndApplicationId('sr', app._id.toString());
            return Promise.all([csPromise, srPromise]);
        }))
        .then(requestEvents => {
            console.log('resolving requestEvents', requestEvents.length);
            return Promise.all(requestEvents);
        })
        .then(results => {
            console.log('resolving final stuff');
            let resultMap = {};
            results.forEach((elem, idx) => {
                resultMap[map[idx]] = {};
                resultMap[map[idx]].cs = elem[0];
                resultMap[map[idx]].sr = elem[1];

            });


            callback(null, {data: createGraph(nodes, resultMap)})
        })
        .catch(err => {
            console.log(err);
            callback(err);
        })
}

function createGraph(nodes, resultsMap) {
    const edges = [];
    const requestsIdMap = {};
    const testMap = {};

    nodes.forEach(app => {

        resultsMap[app._id].cs.forEach(event => {
            requestsIdMap[event.request_id] = {
                sourceName: app.name,
                sourceId: app._id
            };
            // console.log('cs request_id, app:', event.request_id, app.name);
        });

        console.log();

        resultsMap[app._id].sr.forEach(event => {
            if(requestsIdMap[event.request_id]) {
                if(testMap[requestsIdMap[event.request_id].sourceId + ' + ' + app._id]) {
                    testMap[requestsIdMap[event.request_id].sourceId + ' + ' + app._id].counter += 1;
                } else {
                    testMap[requestsIdMap[event.request_id].sourceId + ' + ' + app._id] = {
                        counter: 1
                    };
                }


                requestsIdMap[event.request_id].targetName = app.name;
                requestsIdMap[event.request_id].targetId = app._id;
                // console.log('sr request_id, app:', event.request_id, app.name);
            } else {
                console.log('whops, there was a missing cs event');
            }
        });

    });
    console.log(testMap);
    console.timeEnd('buildingGraph');
    return requestsIdMap;
    // console.log('irgendeineMap', irgendeineMap);
    // console.log('nodes', nodes)
    // console.log('resultsMap', resultsMap)
}


function generateApplicationToken(ruid, system_id, app_id) {
    return jwt.sign({
        ruid,
        system_id,
        app_id
    }, 'pw');
}