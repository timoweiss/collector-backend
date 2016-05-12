'use strict';


const database = require('./database');

module.exports = {
    insertLoadavg,
    insertMemory,
    insertAll
};

function insertAll(args, callback) {
    // console.log('all metrics:', util.inspect(args, {colors: true, depth: 20}));
    // callback(null, {data: args});
    let loadP = insertLoadavg({loadavg: args.osdata.loadavg});
    let memP = insertMemory({memory: args.osdata.memory});

    Promise.all([loadP, memP])
        .then(results => callback(null, {data: {loadavg: results[0].data, memory: results[1].data}}))
        .catch(callback);

}


function insertLoadavg(args, callback) {

    callback = callback || () => {
        };

    const loadavg = args.loadavg.map(point => [point]);

    return database.insertPoints('loadavg', loadavg)
        .then(result => {
            callback(null, {data: result});
            return result;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}

function insertMemory(args, callback) {

    callback = callback || () => {
        };

    const memory = args.memory.map(point => [{
        rss: point.value.rss,
        heapTotal: point.value.heapTotal,
        heapUsed: point.value.heapUsed,
        time: point.time
    }]);


    return database.insertPoints('memory', memory)
        .then(result => {
            callback(null, {data: result});
            return result;
        })
        .catch(err => {
            callback(err);
            return err;
        });
}