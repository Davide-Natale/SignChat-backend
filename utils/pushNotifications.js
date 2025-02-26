'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

//  Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (fcmTokens, data) => {
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    console.log(cleanedData);

    const message = {
        tokens: fcmTokens,
        data: cleanedData,
        android: {
            priority: 'high'
        }
    };

    await admin.messaging().sendEachForMulticast(message);
};

module.exports = sendPushNotification;