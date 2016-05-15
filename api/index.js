'use strict';

const Glue = require('glue');
const hoek = require('hoek');

const unwrap = require('./lib/responseCodes').unwrap;

const API_PORT = process.env['API_PORT'] || 2020;

let swaggerOptions = {
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.'
    },
    securityDefinitions: {
        'jwt': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    security: [{'jwt': []}]
};

const manifest = {
    connections: [{
        port: API_PORT,
        // TODO remove in production
        routes: {
            cors: true
        }
    }],
    registrations: [{
        plugin: 'inert'
    }, {
        plugin: 'vision'
    }, {
        plugin: {
            register: 'hapi-swagger',
            options: swaggerOptions
        }
    }, {
        plugin: 'chairo'
    }, {
        plugin: './plugins/auth'
    }, {
        plugin: './plugins/users'
    }, {
        plugin: './plugins/metrics'
    }, {
        plugin: './plugins/systems'
    }, {
        plugin: './plugins/applications'
    }]
};

Glue.compose(manifest, {relativeTo: __dirname})
    .then(server => {


        server.on('route', (route, connection, server) => {

            console.log('New route added: ' + route.path);
        });

        server.on('log', (event, tags) => {
            console.log(event, tags);
        });

        server.ext('onPostAuth', (request, reply) => {
            let requestAuth = request.auth;
            request.requesting_user_id = {};
            request.system_id = requestAuth.credentials ? requestAuth.credentials.system_id : '';
            request.requesting_user_id.ruid = requestAuth.credentials && requestAuth.credentials.user && requestAuth.credentials.user._id ? requestAuth.credentials.user._id : 'unknown';


            // delay all requests to simulate network-latency for the frontend guys ;)
            let delay = process.env['PRODUCTION'] ? 0 : 1000;

            // setTimeout(function () {
            reply.continue();
            // }, delay);

        });

        server.seneca.use('../serviceInfrastructure', {auto: true});

        server.decorate('request', 'applyToDefaults', hoek.applyToDefaults);

        server.decorate('request', 'unwrap', unwrap);


        return server;
    })
    .then(server => server.start())
    .then(() => console.log(`Server running at port ${API_PORT}`))
    .catch(console.error);