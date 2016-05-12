'use strict';

const joi = require('joi');

let validations = {};

validations.createSystem = joi.object().keys({
    name: joi.string().required(),
    description: joi.string()
});

validations.login = joi.object().keys({
    mail: joi.string().email().required(),
    password: joi.string().required()
});

validations.id = joi.object().keys({
    id: joi.string().min(5).required()
});

module.exports = validations;