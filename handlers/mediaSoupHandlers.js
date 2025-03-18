'use strict';

const mediaSoup = require('../config/mediaSoup');

const onGetRouterRtpCapabilities = (callback) => {
    const router = mediaSoup.getRouter();

    if(router) {
        callback(router.rtpCapabilities);
    } else {
        callback(null);
    }
};

module.exports = { onGetRouterRtpCapabilities };