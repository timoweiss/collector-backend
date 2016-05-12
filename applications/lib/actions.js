'use strict';

const database = require('./database');

module.exports = {
    createApplication
};


function createApplication(args, callback) {

    args.created_by = args.ruid;

    database.createApplication(args)
        .then(response => callback(null, {data: response}))
        .catch(callback);
}