'use strict';

const mongodb = require('mongodb');
const mongo = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const joi = require('joi');
const mongoUrl = `mongodb://${process.env['DB_HOST'] || 'localhost'}:${process.env['DB_PORT'] || 27017}/${process.env['DB_NAME'] || 'test'}`;
const COLLECTION_USER = 'users';

let db = {};

module.exports = {
    createUser,
    getUserByMail,
    getAllUser,
    byId,
    connect
};

const UserModel = joi.object().keys({
    name: joi.string().required(),
    surname: joi.string(),
    password: joi.string().required(),
    mail: joi.string().email().required(),
    pplan: joi.string().required(),
    maxSystems: joi.number().required(),
    image_id: joi.string()
});


function createUser(userData) {
    const validated = joi.validate(userData, UserModel, {stripUnknown: true});
    if (validated.error) {
        return Promise.reject({err: validated.err});
    }
    const collection = db.collection('users');

    return collection.insertOne(validated.value).then(() => rmPassword(validated.value));

}

function getUserByMail(mail) {
    return db.collection(COLLECTION_USER)
        .find({mail: mail})
        .limit(-1)
        .toArray()
        .then(unwrapFirstElem);
}

function byId(id, removePw) {
    return db.collection(COLLECTION_USER)
        .find(new ObjectId(id))
        .toArray()
        .then(unwrapFirstElem)
        .then(user => {
            if (removePw) {
                return rmPassword(user);
            }
            return user;
        });
}

function getAllUser(args) {

    return db.collection(COLLECTION_USER).find().toArray();
}

function unwrapFirstElem(arr) {
    return arr[0];
}

function connect () {
    return mongo.connect(mongoUrl).then(_db => {
        db = _db;
        return db.collection(COLLECTION_USER).createIndex({'mail': 1}, {unique: true});
    });
}

const rmPassword = user => delete user.password ? user : user;