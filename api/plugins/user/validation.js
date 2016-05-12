'use strict';

const joi = require('joi');

let validations = {};

validations.register = joi.object().keys({
    mail: joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    password: joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required(),
    name: joi.string().required(),
    surname: joi.string()
});


module.exports = validations;