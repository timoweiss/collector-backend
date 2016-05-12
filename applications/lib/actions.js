'use strict';

const database = require('./database');

module.exports = {
    createApplication
};


function createApplication(args, callback) {
    database.createApplication(args)
        .then(response => callback(null, {data: response}))
        .catch(callback);
}