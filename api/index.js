'use strict';

const Glue = require('glue');
const hoek = require('hoek');

const unwrap = require('./lib/responseCodes').unwrap;

const API_PORT = process.env['API_PORT'] || 2020;

const manifest = {
    connections: [{
        port: API_PORT,
        // TODO remove in production
        routes: {
            cors: true
        }
    }],
    registrations: [{
        plugin: 'chairo'
    }, {
        plugin: './plugins/users'
    }, {
        plugin: './plugins/metrics'
    }, {
        plugin: './plugins/systems'
    }, {
        plugin: './plugins/applications'
    }, {
        plugin: 'inert'
    }, {
        plugin: 'vision'
    }, {
        plugin: 'hapi-swagger'
    }, {
        plugin: 'hapi-auth-cookie'
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

        // configure auth strategy
        server.auth.strategy('session', 'cookie', true, {
            password: process.env['COOKIE_SECRET'] || 'secretzweiunddreisigzeichenmindestens',
            ttl: 24 * 60 * 60 * 1000 * 365,   // 1 year
            keepAlive: true,
            cookie: 'monitor',
            isSecure: false, //TODO
            clearInvalid: true,
            isHttpOnly: false // TODO
        });


        server.ext('onPostAuth', (request, reply) => {
            let requestAuth = request.auth;
            request.requesting_user_id = {};
            request.system_id = requestAuth.credentials ? requestAuth.credentials.system_id : '';
            request.requesting_user_id.ruid = requestAuth.credentials && requestAuth.credentials.user._id ? requestAuth.credentials.user._id : 'unknown';


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