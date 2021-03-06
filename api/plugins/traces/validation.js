'use strict';

const joi = require('joi');

let validations = {};

validations.id = joi.object().keys({
    id: joi.string().required()
});

validations.timeQuery = joi.object().keys({
    since: joi.string().valid(['5m', '10m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '2d', '3d', '7d']),
    from: joi.date(),
    to: joi.date(),
    durationThreshold: joi.number().min(1)
});

module.exports = validations;