'use strict';

const db = require('./database');

module.exports = {
    createSystem
};


function createSystem(args, callback) {

    db.createSystem(args)
        .then(response => callback(null, {data: response}))
        .catch(err => callback(err));
}