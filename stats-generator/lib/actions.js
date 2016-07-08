'use strict';

const CronJob = require('cron').CronJob;

module.exports = {
    init
};


function init(args, callback) {
    console.log('stats, init called');

    new CronJob('00 09 18 * * 1-7', function() {
        console.log('You will see ', arguments, new Date().toISOString());
    }, null, true);

    callback(null, {data: {}});



}
