'use strict';

module.exports = {
    insertLoadavg,
    insertAll
};

function insertAll(args, callback) {
    console.log('all metrics:', args);
    callback(null, {data: args});
}


function insertLoadavg(args, callback) {
    callback(null, {data: 'data'});
}