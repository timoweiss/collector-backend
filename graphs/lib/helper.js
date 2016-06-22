'use strict';

module.exports = {
    transformGraph
};


function transformGraph(rawData, stats) {

    let statsByAppId = sortStatsByAppId(stats);

    console.time('generating graph');
    let nodesMap = {};
    let edgesMap = {};
    let nodes = [];
    let edges = [];
    rawData.forEach(elem => {
        let sender = elem._fields[0].properties;
        nodesMap[sender.id] = sender;
        nodesMap[sender.id].stats = {
            memory: statsByAppId.memory[sender.id],
            loadavg: statsByAppId.loadavg[sender.id],
            requests: statsByAppId.requests[sender.id]
        };

        let receiver = elem._fields[3].properties;
        nodesMap[receiver.id] = receiver;
        nodesMap[receiver.id].stats = {
            memory: statsByAppId.memory[receiver.id],
            loadavg: statsByAppId.loadavg[receiver.id],
            requests: statsByAppId.requests[receiver.id]
        };

        edgesMap[sender.id + '|' + receiver.id] = {
            requests: elem._fields[1].low,
            avgDuration: Math.floor(elem._fields[2] / 1000),
            source: sender.id,
            target: receiver.id
        }
    });
    for (let id in nodesMap) {
        if (nodesMap.hasOwnProperty(id)) {
            nodes.push(nodesMap[id]);
        }
    }

    for (let id in edgesMap) {
        if (edgesMap.hasOwnProperty(id)) {
            edges.push(edgesMap[id]);
        }
    }
    console.timeEnd('generating graph');
    return {nodes, edges}
}




function sortStatsByAppId(stats) {
    let returnObject = {
        memory: {},
        loadavg: {},
        requests: {}
    };

    stats.memory.forEach(stat => {
        returnObject.memory[stat.app_id] = stat;
        delete stat.app_id;
        delete stat.time;
    });

    stats.loadavg.forEach(stat => {
        returnObject.loadavg[stat.app_id] = stat;
        delete stat.app_id;
        delete stat.time;
    });

    stats.requests.forEach(stat => {
        returnObject.requests[stat.app_id] = returnObject.requests[stat.app_id] ? returnObject.requests[stat.app_id] : {};
        returnObject.requests[stat.app_id][stat.type] = stat;
        delete stat.app_id;
        delete stat.time;
    });
    return returnObject;
}