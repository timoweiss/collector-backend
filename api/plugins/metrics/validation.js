'use strict';

const joi = require('joi');

let validations = {};

validations.loadQuery = joi.object().keys({
    aggregate_fn: joi.string().valid(['mean', 'median', 'stddev', 'spread', 'min', 'max']),//.when('period', {is: '7days', then: joi.required()}),
    group_by_value: joi.number().min(1),
    group_by_unit: joi.string().valid(['s', 'm', 'h', 'd']),
    period: joi.string().valid(['5m', '15m', '30m', '1h', '3h', '6h', '12h', '2d', '7d']).required()
});

validations.memoryQuery = joi.object().keys({
    aggregate_fn: joi.string().valid(['mean', 'median', 'stddev', 'spread', 'min', 'max']),//.when('period', {is: '7days', then: joi.required()}),
    group_by_value: joi.number().min(1),
    group_by_unit: joi.string().valid(['s', 'm', 'h', 'd']),
    period: joi.string().valid(['5m', '15m', '30m', '1h', '3h', '6h', '12h', '2d', '7d']).required()
});


validations.id = joi.object().keys({
    id: joi.string().min(5).required()
});


module.exports = validations;