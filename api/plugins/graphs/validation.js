'use strict';

const joi = require('joi');

let validations = {};

validations.getGraphQuery = joi.object().keys({
    from: joi.date().max('now'),
    to: joi.date().min(joi.ref('from')).max('now')
});

validations.id = joi.object().keys({
    id: joi.string().required()
});

module.exports = validations;