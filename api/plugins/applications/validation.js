'use strict';

const joi = require('joi');

let validations = {};

validations.id = joi.object().keys({
    id: joi.string().min(5).required()
});


validations.createApplication = joi.object().keys({
    name: joi.string().min(5).required(),
    description: joi.string(),
    platform: joi.string().valid(['nodejs', 'jvm']).default('nodejs')
});

module.exports = validations;