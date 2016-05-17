'use strict';

const joi = require('joi');

let validations = {};

validations.getGraphQuery = joi.object.keys({
    from: joi.date().max('now'),
    to: joi.date.min(Joi.ref('from'))
});