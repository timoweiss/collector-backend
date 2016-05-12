'use strict';

const mongodb = require('mongodb');
const mongo = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const joi = require('joi');
const mongoUrl = `mongodb://${process.env['DB_HOST'] || 'localhost'}:${process.env['DB_PORT'] || 27017}/${process.env['DB_NAME'] || 'test'}`;
const COLLECTION_SYSTEMS = 'systems';

let db = {};

module.exports = {
    createSystem
};

const SystemModel = joi.object().keys({
    name: joi.string().required(),
    description: joi.string()
});


function createSystem(systemData) {
    const validated = joi.validate(systemData, SystemModel, {stripUnknown: true})
    if (validated.error) {
        return Promise.reject({err: validated.err});
    }
    const collection = db.collection(COLLECTION_SYSTEMS);

    return collection.insertOne(validated.value);

}
function unwrapFirstElem(arr) {
    return arr[0];
}

function connect () {
    return mongo.connect(mongoUrl).then(_db => {
        db = _db;
        return db;
        // return db.collection(COLLECTION_USER).createIndex({'mail': 1}, {unique: true});
    }).catch(err => console.error(err));
}
