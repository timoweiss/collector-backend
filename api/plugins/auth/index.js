'use strict';
const jwt = require('jsonwebtoken');


exports.register = (server, options, next) => {

    server.register({
            register: require('hapi-auth-jwt2')
        })
        .then(() => {
            server.auth.strategy('jwt', 'jwt', true, {
                key: 'pw',          // Never Share your secret key
                validateFunc: function (decoded, request, callback) {

                    request.app_id = decoded.app_id;
                    request.system_id = decoded.system_id;

                    callback(null, true);
                },            // validate function defined above
                verifyOptions: {algorithms: ['HS256']} // pick a strong algorithm
            });

            server.decorate('request', 'generateJWT', generateJWT);

            next()
        })
        .catch(err => {
            console.log('err', err);
        });


};

exports.register.attributes = {
    name: 'auth',
    version: '1.0.0'
};


function generateJWT(informationToSign) {
    return jwt.sign(informationToSign, 'pw');
}