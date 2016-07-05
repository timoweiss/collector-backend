'use strict';

module.exports = {
    init
};


function init(args, callback) {
    console.log('stats, init called');
    callback(null, {data: {}});

}
