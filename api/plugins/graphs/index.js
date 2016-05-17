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
                request.server.seneca.act('role:graphs,cmd:get', request.query, function (err, data) {
                    if(err) {
                        return reply(err);
                    }

                    let rawGraphData = request.unwrap(data);
                    let transformedGraph = transformGraph(rawGraphData.records);
                    console.timeEnd('gettingGraph');
                    reply(transformedGraph);
                });
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

function transformGraph(rawData) {
    let nodes = {};
    let edges = {};
    rawData.forEach(elem => {
        nodes[elem._fields[0].properties.id] = elem._fields[0].properties;
        nodes[elem._fields[2].properties.id] = elem._fields[2].properties;
        edges[elem._fields[0].properties.id + '|' + elem._fields[2].properties.id] = elem._fields[1]
    });
    return {nodes, edges}
}