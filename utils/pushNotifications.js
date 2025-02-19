'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

//  Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (fcmTokens, data) => {
    const message = {
        tokens: fcmTokens,
        data,
        android: {
            priority: 'high'
        }
    };

    await admin.messaging().sendEachForMulticast(message);
};

module.exports = sendPushNotification;