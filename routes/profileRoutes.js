'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, deleteProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/profileController');
const authenticate = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve profile information of the currently authenticated user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     id: 
 *                       $ref: '#/components/schemas/Id'
 *                   required: 
 *                     - id
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     imageProfile:
 *                       $ref: '#/components/schemas/ImageProfile'
 *                   required: 
 *                     - imageProfile
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     description: Update profile information of the currently authenticated user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: New authenticated user profile information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Authenticated user updated profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: 
 *                 - message
 *                 - user
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *                 user: 
 *                   allOf:
 *                     - type: object
 *                       properties:
 *                         id: 
 *                           $ref: '#/components/schemas/Id'
 *                       required: 
 *                         - id
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         imageProfile:
 *                           $ref: '#/components/schemas/ImageProfile'
 *                       required: 
 *                         - imageProfile
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       409:
 *         description: Email or phone number already used.
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
router.put('/profile', authenticate, [
    body('firstName')
        .exists()
        .withMessage('FirstName parameter is required.')
        .isString()
        .withMessage('FirstName parameter must be a string.')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string.'),
    body('lastName')
        .exists()
        .withMessage('LastName parameter is required.')
        .isString()
        .withMessage('LastName parameter must be a string.')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string.'),
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter parameter is not an email.'),
    body('phone')
        .exists()
        .withMessage('Phone parameter is required.')
        .isString()
        .withMessage('Phone parameter must be a string.')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string.")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters.')
], updateProfile);

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Delete user profile
 *     description: Delete profile of the currently authenticated user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User refresh token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile deleted successfully
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
 *         description: User not found
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
router.delete('/profile', authenticate, [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], deleteProfile);

/**
 * @swagger
 * /profile/image:
 *   post:
 *     summary: Upload user profile image
 *     description: Upload profile image of the currently authenticated user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Authenticated user profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: No file uploaded
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/profile/image', authenticate, upload.single('image'), uploadProfileImage);

/**
 * @swagger
 * /profile/image:
 *   delete:
 *     summary: Delete user profile image
 *     description: Delete profile image of the currently authenticated user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: No profile image to delete
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/profile/image', authenticate, deleteProfileImage);

module.exports = router;