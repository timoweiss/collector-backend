'use strict';


exports.register = (server, options, next) => {


    next();

};

exports.register.attributes = {
    name: 'graphs',
    version: '1.0.0'
};