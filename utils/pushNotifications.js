'use strict';

const { Expo } = require('expo-server-sdk');

//  Initialize Expo client
const expo = new Expo();

const sendPushNotification = async (expoTokens, title , message, data) => {
    const messages = [];

    for(let expoToken of expoTokens) {
        if(!Expo.isExpoPushToken(expoToken)) {
            continue;
        }

        messages.push({
            to: expoToken,
            title,
            body: message,
            data
        });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for(let chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
    }
};

module.exports = sendPushNotification;