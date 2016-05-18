'use strict';


const TOKEN_PASSWORD = process.env['JWT_TOKEN_PASSWORD'] || 'pw';

exports.register = (server, options, next) => {


    Promise.all([server.register(require('hapi-auth-jwt2')), server.register(require('hapi-auth-cookie'))])
        .then(() => {

            server.auth.strategy('jwt', 'jwt', {
                key: TOKEN_PASSWORD,
                validateFunc: function (decoded, request, callback) {

                    request.app_id = decoded.app_id;
                    request.system_id = decoded.system_id;

                    callback(null, true);
                },
                verifyOptions: {algorithms: ['HS256']}
            });


            server.auth.strategy('session', 'cookie', true, {
                password: process.env['COOKIE_SECRET'] || 'secretzweiunddreisigzeichenmindestens',
                ttl: 24 * 60 * 60 * 1000 * 365,   // 1 year
                keepAlive: true,
                cookie: 'monitor',
                isSecure: false, //TODO
                clearInvalid: true,
                isHttpOnly: false // TODO
            });

            next();

        })
        .catch(err => {
            console.error('error registering auth plugins', err);
            process.exit();
        });

};

exports.register.attributes = {
    name: 'auth',
    version: '1.0.0'
};