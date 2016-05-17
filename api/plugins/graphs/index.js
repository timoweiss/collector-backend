'use strict';


exports.register = (server, options, next) => {


    server.route({
        method: 'GET',
        path: '/graphs',
        config: {
            handler: function (request, reply) {

                reply({});
            },
            description: 'get the network graph for the currently selected system',
            tags: ['api', 'system', 'graph']
        }
    });


    next();

};

exports.register.attributes = {
    name: 'graphs',
    version: '1.0.0'
};