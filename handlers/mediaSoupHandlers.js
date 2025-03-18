'use strict';

const mediaSoup = require('../config/mediaSoup');

//  TODO: remove logging once tested
module.exports = (router, transports) => {
    const onGetRouterRtpCapabilities = (callback) => {
        if(router) {
            callback(router.rtpCapabilities);
        } else {
            callback(null);
        }
    };

    const onConnectTransport = async ({ transportId, dtlsParameters }, callback) => {
        try {
            const transport = transports.get(transportId);
            console.log(transport);
            await transport.connect({ dtlsParameters });
            callback({ success: true });
        } catch (error) {
            console.log(error);
            callback({ success: false, error: error.message });
        }
    };

    return { onGetRouterRtpCapabilities, onConnectTransport };
}