'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createToken, deleteToken, syncToken } = require('../controllers/tokensController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /tokens:
 *   post:
 *     summary: Register a new token 
 *     description: Register a new FCM token associated to a device id
 *     tags:
 *       - Tokens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: New FCM token to be registered
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmToken'
 *     responses:
 *       201:
 *         description: Token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Message'
 *                 - type: object
 *                   required:
 *                     - token
 *                   properties:
 *                     token: 
 *                       allOf:
 *                         - type: object
 *                           required:
 *                             - id
 *                           properties:        
 *                             id: 
 *                               $ref: '#/components/schemas/Id'
 *                         - $ref: '#/components/schemas/FcmToken'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       409:
 *         description: Token already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /tokens/sync:
 *   post:
 *     summary: Synch an updated token 
 *     description: Synch an updated FCM token associated to an already registered device id
 *     tags:
 *       - Tokens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Updated FCM token to be synced
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FcmToken'
 *     responses:
 *       200:
 *         description: Token synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Message'
 *                 - type: object
 *                   required:
 *                     - token
 *                   properties:
 *                     token: 
 *                       allOf:
 *                         - type: object
 *                           required:
 *                             - id
 *                           properties:        
 *                             id: 
 *                               $ref: '#/components/schemas/Id'
 *                         - $ref: '#/components/schemas/FcmToken'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /tokens:
 *   delete:
 *     summary: Delete a registered token 
 *     description: Delete a FCM token associated to an already registered device id
 *     tags:
 *       - Tokens
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: FCM token to be deleted 
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties: 
 *               fcmToken:
 *                type: string
 *     responses:
 *       200:
 *         description: Token deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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