'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createToken, deleteToken } = require('../controllers/tokensController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/tokens', authenticate, [
    body('expoToken')
        .exists()
        .withMessage('ExpoToken parameter is required.')
        .isString()
        .withMessage('ExpoToken parameter must be a string.')
        .notEmpty()
        .withMessage('ExpoToken parameter cannot be an empty string.')
        .matches(/^ExponentPushToken\[[A-Za-z0-9_]+\]$/)
        .withMessage('Invalid token format.')
], createToken);

router.delete('/tokens', authenticate, [
    body('expoToken')
        .exists()
        .withMessage('ExpoToken parameter is required.')
        .isString()
        .withMessage('ExpoToken parameter must be a string.')
        .notEmpty()
        .withMessage('ExpoToken parameter cannot be an empty string.')
        .matches(/^ExponentPushToken\[[A-Za-z0-9_]+\]$/)
        .withMessage('Invalid token format.')
], deleteToken);

module.exports = router;