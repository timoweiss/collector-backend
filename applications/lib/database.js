'use strict';

const mongodb = require('mongodb');
const mongo = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const joi = require('joi');
const mongoUrl = `mongodb://${process.env['DB_HOST'] || 'localhost'}:${process.env['DB_PORT'] || 27017}/${process.env['DB_NAME'] || 'test'}`;
const COLLECTION_APPLICATIONS = 'applications';
const COLLECTION_APPLICATIONS_REQUESTEVENTS = 'app_request_events';

let db = {};

module.exports = {
    createApplication,
    addApplicationToken,
    getApplicationsBySystemId,
    insertRequestEvents,
    findEventsByTypeAndApplicationId,
    connect
};

const ApplicationModel = joi.object().keys({
    name: joi.string().required(),
    created_by: joi.string().required(),
    system_id: joi.string().required(),
    app_token: joi.string(),
    description: joi.string()
});


function createApplication(applicationData) {
    const validated = joi.validate(applicationData, ApplicationModel, {stripUnknown: true});

    if (validated.error) {
        return Promise.reject({err: validated.error});
    }
    const collection = db.collection(COLLECTION_APPLICATIONS);

    return collection.insertOne(validated.value)
        .then(() => validated.value);

}

function addApplicationToken(applicationToken, applicationId) {
    const oId = new ObjectId(applicationId);
    const collection = db.collection(COLLECTION_APPLICATIONS);

    console.log('adding application token', applicationToken, 'to app_id', applicationId);
    return collection.updateOne({_id: oId}, {$set: {app_token: applicationToken}})


}

function getApplicationsBySystemId(systemId) {
    const collection = db.collection(COLLECTION_APPLICATIONS);

    return collection.find({system_id: systemId}).toArray();
}

function findEventsByTypeAndApplicationId(event, applicationId) {

    const collection = db.collection(COLLECTION_APPLICATIONS_REQUESTEVENTS);
    console.log('requesting:', applicationId, event)
    return collection.find({app_id: applicationId, 'annotations.value': event}).toArray();
}

function insertRequestEvents(eventData) {
    const collection = db.collection(COLLECTION_APPLICATIONS_REQUESTEVENTS);
    return collection.insertMany(eventData);
}

function unwrapFirstElem(arr) {
    return arr[0];
}

function connect() {
    return mongo.connect(mongoUrl).then(_db => {
        db = _db;
        return db;
        // return db.collection(COLLECTION_USER).createIndex({'mail': 1}, {unique: true});
    }).catch(err => console.error(err));
}
