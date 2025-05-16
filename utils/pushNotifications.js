'use strict';

const { messaging } = require('../config/firebase');

const sendPushNotification = async (fcmTokens, data) => {
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const message = {
        tokens: fcmTokens,
        data: cleanedData,
        android: {
            priority: 'high'
        }
    };

    await messaging.sendEachForMulticast(message);
};

module.exports = sendPushNotification;