'use strict';

const boom = require('boom');

module.exports = {
    generateTimequery
};

function getDefaultDate() {
    const now = Date.now();
    return {
        from: now - INTERVAL['30m'],
        to: now
    }
}

const INTERVAL = {
    '5m': 300000,
    '10m': 600000,
    '15m': 900000,
    '30m': 1800000,
    '1h': 3600000,
    '2h': 7200000,
    '4h': 14400000,
    '12h': 43200000,
    '1d': 86400000,
    '2d': 172800000,
    '3d': 259200000,
    '7d': 604800000
};

function generateTimequery(query, allowDefault) {

    const isQueryEmpty = Object.getOwnPropertyNames(query).length === 0;

    if (isQueryEmpty && !allowDefault) {
        return null;
    }
    if (!allowDefault && !query.from && !query.to && !query.since) {
        return null;
    }

    if (isQueryEmpty && allowDefault) {
        return getDefaultDate();
    }

    let returnObject = {};

    let now = Date.now();
    let interval;

    if (query.since) {
        interval = INTERVAL[query.since];
    }

    // casting to integer (millis)
    let from = query.from ? query.from * 1 : 0;
    let to = query.to ? query.to * 1 : 0;

    if (interval) {
        returnObject.from = now - interval;
        returnObject.to = now;
    }

    if (from && interval) {
        returnObject.from = from;
        returnObject.to = from + interval;
    }

    if (to && interval) {
        returnObject.from = to - interval;
        returnObject.to = to;
    }

    if (from && to) {
        returnObject.from = from;
        returnObject.to = to;
    }

    if (allowDefault && !returnObject.from && !returnObject.to) {

    }

    return returnObject

}

console.log(generateTimequery({}, true));