'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

//  Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const messaging = admin.messaging();

module.exports = { messaging };