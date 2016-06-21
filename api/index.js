'use strict';

require('shimmingtest').start({
    application_id: '_index',
    service_name: 'service_index',
    host: 'localhost',
    "app_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJydWlkIjoiNTc1ZWU2MWIyMTMxOTk1NzI3M2I5NTZiIiwic3lzdGVtX2lkIjoiNTc2OWE5ZTM1MWY5NmU0MjI5ZmZhN2I5IiwiYXBwX2lkIjoiNTc2OWFhMjVhZGY5OGU0MjI5YmNiZjQ4IiwiaWF0IjoxNDY2NTQyNjI5fQ.RvnopcOJUB_57wvw8gWiUd-d0h1mKtac4GBOMEWIXe0",
});

require('dotenv').config();

const Glue = require('glue');
const hoek = require('hoek');

const unwrap = require('./lib/responseCodes').unwrap;

const API_PORT = process.env['API_PORT'] || 2020;

const manifest = {
    connections: [{
        port: API_PORT,
        // TODO remove in production
        routes: {
            cors: {
                origin: ['*'],
                credentials: true
            }
        }
    }],
    registrations: [{
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
    }, {
        plugin: './plugins/traces'
    }, {
        plugin: './plugins/graphs'
    }, {
        plugin: 'inert'
    }, {
        plugin: 'vision'
    }, {
        plugin: 'hapi-swagger'
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

        server.seneca.use('mesh', {auto: true});

        server.decorate('request', 'applyToDefaults', hoek.applyToDefaults);

        server.decorate('request', 'unwrap', unwrap);


        return server;
    })
    .then(server => server.start())
    .then(() => console.log(`Server running at port ${API_PORT}`))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });