'use strict';

const CronJob = require('cron').CronJob;

module.exports = {
    init
};


function init(args, callback) {
    const seneca = this;
    console.log('stats, init called');

    new CronJob('30 * 23 * * 1-7', function() {
        seneca.act({role: 'systems', cmd: 'getall'}, function(err, response) {
            const systemIds = response.data.map(system => system._id.toString());

            console.log(err || systemIds);

            console.log('generating stats summary for', systemIds.length, 'systems');

            if(systemIds.length) {
                pullStatsForSystems(this, systemIds);


            }


        });
    }, null, true);

    callback(null, {data: {}});



}


function pullStatsForSystems(seneca, systemIds) {
    if(systemIds.length) {

        const systemId = systemIds.pop();
        setTimeout(() => {
            console.log('lalala', systemId);

            seneca.act({role: 'metrics', cmd: 'query', type: 'serviceStats', system_id: systemId, since: '30m'}, function(err, response) {
                if(err) {
                    console.error('ugh, that should not happen');
                    return pullStatsForSystems(this, systemIds);
                }

                console.log('result', response.data);
                pullStatsForSystems(this, systemIds)

            });

        }, 1000);
    } else {
        console.log('all stats generated');
    }


}