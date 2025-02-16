'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createToken, deleteToken, syncToken } = require('../controllers/tokensController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/tokens', authenticate, [
    body('deviceId')
        .exists()
        .withMessage('DeviceId parameter is required.')
        .isString()
        .withMessage('DeviceId parameter must be a string.')
        .notEmpty()
        .withMessage('DeviceId parameter cannot be an empty string.'),
    body('fcmToken')
        .exists()
        .withMessage('FCMToken parameter is required.')
        .isString()
        .withMessage('FCMToken parameter must be a string.')
        .notEmpty()
        .withMessage('FCMToken parameter cannot be an empty string.')
], createToken);

router.post('/tokens/sync', authenticate, [
    body('deviceId')
        .exists()
        .withMessage('DeviceId parameter is required.')
        .isString()
        .withMessage('DeviceId parameter must be a string.')
        .notEmpty()
        .withMessage('DeviceId parameter cannot be an empty string.'),
    body('fcmToken')
        .exists()
        .withMessage('FCMToken parameter is required.')
        .isString()
        .withMessage('FCMToken parameter must be a string.')
        .notEmpty()
        .withMessage('FCMToken parameter cannot be an empty string.')
], syncToken);

router.delete('/tokens', authenticate, [
    body('fcmToken')
        .exists()
        .withMessage('FCMToken parameter is required.')
        .isString()
        .withMessage('FCMToken parameter must be a string.')
        .notEmpty()
        .withMessage('FCMToken parameter cannot be an empty string.')
], deleteToken);

module.exports = router;