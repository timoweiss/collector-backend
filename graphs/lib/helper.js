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
        nodesMap[elem._fields[0].properties.id] = elem._fields[0].properties;
        nodesMap[elem._fields[0].properties.id].stats = getStatsObjectByAppId(elem._fields[0].properties.id, stats);

        nodesMap[elem._fields[2].properties.id] = elem._fields[2].properties;
        nodesMap[elem._fields[2].properties.id].stats = getStatsObjectByAppId(elem._fields[2].properties.id, stats);

        edgesMap[elem._fields[0].properties.id + '|' + elem._fields[2].properties.id] = {
            requests: elem._fields[1].low,
            source: elem._fields[0].properties.id,
            target: elem._fields[2].properties.id
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

function getStatsObjectByAppId(appId, stats) {
    const statObj = {};

    statObj.memory = stats.memory.filter(stat => stat.tags.app_id === appId);
    statObj.loadavg = stats.loadavg.filter(stat => stat.tags.app_id === appId);

    statObj.request = {};
    statObj.request.clientSent = stats.requests.CS.filter(stat => stat.tags.app_id === appId);
    statObj.request.serverReceive = stats.requests.SR.filter(stat => stat.tags.app_id === appId);

    if(statObj.memory.length) {
        statObj.memory = statObj.memory[0].values[0][1];
    } else {
        statObj.memory = 'N/A';
    }

    if(statObj.loadavg.length) {
        statObj.loadavg = statObj.loadavg[0].values[0][1];
    } else {
        statObj.loadavg = 'N/A';
    }

    if(statObj.request.clientSent.length) {
        statObj.request.clientSent = statObj.request.clientSent[0].values[0][1];
    } else {
        statObj.request.clientSent = 0;
    }

    if(statObj.request.serverReceive.length) {
        statObj.request.serverReceive = statObj.request.serverReceive[0].values[0][1];
    } else {
        statObj.request.serverReceive = 0;
    }

    return statObj;
}