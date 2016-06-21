'use strict';

module.exports = {
    transformGraph
};


function transformGraph(rawData, stats) {
    
    console.time('generating graph');
    let nodesMap = {};
    let edgesMap = {};
    let nodes = [];
    let edges = [];
    rawData.forEach(elem => {
        let sender = elem._fields[0].properties;
        nodesMap[sender.id] = sender;
        nodesMap[sender.id].stats = getStatsObjectByAppId(sender.id, stats);

        let receiver = elem._fields[3].properties;
        nodesMap[receiver.id] = receiver;
        nodesMap[receiver.id].stats = getStatsObjectByAppId(receiver.id, stats);

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


// TODO this could be done in metrics service, maybe
function getStatsObjectByAppId(appId, stats) {
    const statObj = {};

    if (!stats.memory || !Array.isArray(stats.memory)) {
        stats.memory = [];
    }

    if (!stats.loadavg || !Array.isArray(stats.loadavg)) {
        stats.loadavg = [];
    }

    if (!stats.requests) {
        stats.requests = {};
        stats.requests.CS = [];
        stats.requests.SR = [];
    }

    if (!Array.isArray(stats.requests.CS)) {
        stats.requests.CS = [];
    }

    if (!Array.isArray(stats.requests.SR)) {
        stats.requests.SR = [];
    }

    statObj.memory = stats.memory.filter(stat => stat.app_id === appId) || [];
    statObj.loadavg = stats.loadavg.filter(stat => stat.app_id === appId) || [];

    statObj.request = {};
    statObj.request.clientSent = stats.requests.filter(stat => stat.app_id === appId && stat.type === 'CS') || [];
    statObj.request.serverReceive = stats.requests.filter(stat => stat.app_id === appId && stat.type === 'SR') || [];

    if (statObj.memory.length) {
        delete statObj.memory[0].time;
        delete statObj.memory[0].app_id;
        statObj.memory = statObj.memory[0];
    } else {
        statObj.memory = 'N/A';
    }

    if (statObj.loadavg.length) {
        delete statObj.loadavg[0].time;
        delete statObj.loadavg[0].app_id;
        statObj.loadavg = statObj.loadavg[0];
    } else {
        statObj.loadavg = 'N/A';
    }

    if (statObj.request.clientSent.length) {
        delete statObj.request.clientSent[0].time;
        delete statObj.request.clientSent[0].app_id;
        statObj.request.clientSent = statObj.request.clientSent[0];
    } else {
        statObj.request.clientSent = 0;
    }

    if (statObj.request.serverReceive.length) {
        delete statObj.request.serverReceive[0].time;
        delete statObj.request.serverReceive[0].app_id;
        statObj.request.serverReceive = statObj.request.serverReceive[0];
    } else {
        statObj.request.serverReceive = 0;
    }

    return statObj;
}