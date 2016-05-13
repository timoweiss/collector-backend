'use strict';

const joi = require('joi');

let validations = {};

validations.loadQuery = joi.object().keys({
    aggregate_fn: joi.string().valid(['mean', 'median', 'stddev', 'spread', 'min', 'max']).when('period', {is: '7days', then: joi.required()}),
    group_by_value: joi.number().min(1),
    group_by_unit: joi.string().valid(['s', 'm', 'h', 'd']),
    period: joi.string().valid(['5mins', '15mins', '30mins', '60mins', '3hours', '6hours', '12hours', '2days', '7days']).required()
});


module.exports = validations;