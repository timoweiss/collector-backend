'use strict';

const validation = require('./validation');

exports.register = (server, options, next) => {


    server.route({
        method: 'GET',
        path: '/graphs',
        config: {
            handler: function (request, reply) {

                request.query.system_id = request.system_id;
                console.time('gettingGraph');
                let graphData = null;
                let statsData = null;

                request.server.seneca.act('role:graphs,cmd:get', request.query, function (err, data) {
                    if (err) {
                        return reply(err);
                    }

                    let rawGraphData = request.unwrap(data);
                    graphData = rawGraphData;
                    console.timeEnd('gettingGraph');
                    done();
                    // reply(transformedGraph);
                });


                console.time('gettingGraph|stats');
                request.server.seneca.act('role:metrics,cmd:query,type:serviceStats', {
                    system_id: request.system_id,
                    from: ''
                }, function(err, data) {
                    console.timeEnd('gettingGraph|stats');
                    // console.log('result from stats:', err || data.data);
                    statsData = data.data;
                    done();
                });

                function done() {
                    if(graphData && statsData) {

                        let transformedGraph = transformGraph(graphData.records, statsData);

                        reply(transformedGraph);
                    }
                }


            },
            description: 'get the network graph for the currently selected system',
            tags: ['api', 'system', 'graph'],
            validate: {
                query: validation.getGraphQuery
            }
        }
    });


    next();

};

exports.register.attributes = {
    name: 'graphs',
    version: '1.0.0'
};

function transformGraph(rawData, stats) {
    console.time('generating graph');
    let nodesMap = {};
    let edgesMap = {};
    let nodes = [];
    let edges = [];
    rawData.forEach(elem => {
        nodesMap[elem._fields[0].properties.id] = elem._fields[0].properties;
        nodesMap[elem._fields[0].properties.id].stats = {
            memory: stats.memory.filter(stat => {
                return stat.tags.app_id === elem._fields[0].properties.id;
            })[0].values[0][1],
            loadavg: stats.loadavg.filter(stat => {
                return stat.tags.app_id === elem._fields[0].properties.id;
            })[0].values[0][1],
            request: stats.requests.filter(stat => {
                return stat.tags.app_id === elem._fields[0].properties.id;
            })[0].values[0][1]
        };

        nodesMap[elem._fields[2].properties.id] = elem._fields[2].properties;
        nodesMap[elem._fields[2].properties.id].stats = {
            memory: stats.memory.filter(stat => {
                return stat.tags.app_id === elem._fields[2].properties.id;
            })[0].values[0][1],
            loadavg: stats.loadavg.filter(stat => {
                return stat.tags.app_id === elem._fields[2].properties.id;
            })[0].values[0][1],
            request: stats.requests.filter(stat => {
                return stat.tags.app_id === elem._fields[2].properties.id;
            })[0].values[0][1]
        };

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