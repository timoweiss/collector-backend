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

validations.timeQuery = joi.object().keys({
    since: joi.string().valid(['5m', '10m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '2d', '3d', '7d']),
    from: joi.date(),
    to: joi.date()
});

validations.timeQueryWithDurations = validations.timeQuery.keys({
    max_duration: joi.number(),
    min_duration: joi.number().min(1).when('max_duration', {
        is: joi.number(),
        then: joi.number().max(joi.ref('max_duration'))
    })
});

validations.metrics = joi.object().keys({
    osdata: joi.object().keys({
        freemem: joi.number(),
        memory: joi.array(),
        loadavg: joi.array(),
        time: joi.date()
    }),
    requests: joi.array(),
    isStartup: joi.boolean().default(false),
    isShutdown: joi.boolean().default(false),
    startupInfo: joi.object().when('isStartup', {is: true, then: joi.required()}),
    shutdownInfo: joi.object().when('isShutdown', {is: true, then: joi.required()})
});


validations.id = joi.object().keys({
    id: joi.string().min(5).required()
});


module.exports = validations;