'use strict';

const database = require('./database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

module.exports = {
    createUser,
    loginUser,
    getUserById,
    getAllUser
};


function createUser(args, callback) {

    bcrypt.hash(args.password, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return callback(err);
        }
        // replace plaintext with hash
        args.password = hash;
        database.createUser(args)
            .then(user => callback(null, {data: user}))
            .catch(err => {
                if(err.code === 11000) {
                    return callback(null, {err: {msg: 'USER_ALREADY_EXISTS'}});
                }
                callback(err);
            });
    });
}

function loginUser(args, callback) {
    database.getUserByMail(args.mail).then(user => {

        if (!user) {
            return callback(null, {err: {msg: 'LOGIN_NOT_FOUND'}});
        }
        bcrypt.compare(args.password, user.password, (err, res) => {
            if (err) {
                return callback(err);
            }
            if (res) {
                delete user.password;
                return callback(null, {data: user});
            }
            // the information can be hidden in the API
            callback(null, {err: {msg: 'WRONG_PASSWORD'}});
        });
    }).catch(err => {
        console.error('login error:', err);
        callback(err);
    });
}

function getUserById(args, callback) {
    database.byId(args.id, true)
        .then(user => callback(null, {data: user}))
        .catch(callback);
}

function getAllUser(args, callback) {
    database.getAllUser(args)
        .then(users => callback(null, {data: users}))
        .catch(callback);
}