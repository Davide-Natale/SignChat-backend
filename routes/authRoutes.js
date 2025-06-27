'use strict';

const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, changePassword, sendOtp, resetPassword, verifyOtp, logout } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware')

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user providing an email and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: New user credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Email'
 *               password:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Password'
 *     responses:
 *       201:
 *         description: New user successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *                 - tokens
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   required:
 *                     - id
 *                     - email
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Id associated to new registered user
 *                     email:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Email'
 *                 tokens:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Tokens'
 *       409:
 *         description: User already registered.
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
router.post('/register', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter is not an email.'),
    body('password')
        .exists()
        .withMessage('Password parameter is required.')
        .isString()
        .withMessage('Password parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('Password parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('Password parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('Password parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('Password parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('Password parameter must contain at least one of these special characters: @$!%*?&#.')
], register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in user
 *     description: Log in user given its own credentials
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: User credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Email'
 *               password:
 *                 type: string
 *                 example: Aa0?aaaa
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Invalid credentials
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
router.post('/login', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter is not an email.'),
    body('password')
        .exists()
        .withMessage('Password parameter is required.')
        .isString()
        .withMessage('Password parameter must be a string.')
        .notEmpty()
        .withMessage("Password parameter cannot be an empty string.")
], login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh user tokens
 *     description: Refresh access and refresh user tokens given the previous ones
 *     tags:
 *       - Auth
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
 *         description: User tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
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
 */
router.post('/refresh-token', [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], refreshToken);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change user password given the previous one
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User old and new password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: Bb1?bbbb
 *               newPassword:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Password'
 *     responses:
 *       200:
 *         description: User password updated successfully
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
router.post('/change-password', authenticate, [
    body('oldPassword')
        .exists()
        .withMessage('OldPassword parameter parameter is required.')
        .isString()
        .withMessage('OldPassword parameter parameter must be a string.')
        .notEmpty()
        .withMessage("OldPassword parameter parameter cannot be an empty string."),
    body('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required.')
        .isString()
        .withMessage('NewPassword parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#.')
], changePassword);

/**
 * @swagger
 * /auth/reset-password/request:
 *   post:
 *     summary: Request reset password
 *     description: Request reset password providing account email
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: Account associated email
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Email'
 *     responses:
 *       200:
 *         description: Otp code sent to provided email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       429:
 *         description: Too many frequent requests
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
router.post('/reset-password/request', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter parameter is not an email.')
], sendOtp);

/**
 * @swagger
 * /auth/reset-password/verify-otp:
 *   post:
 *     summary: Verify email otp
 *     description: Verify otp sent via email to proceed with reset password procedure.
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: Account associated email and otp code
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Email'
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit otp code
 *                 example: 538901
 *     responses:
 *       200:
 *         description: Otp code verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - accessToken
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
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
 *               $ref: '#/components/schemas/Message'
 */
router.post('/reset-password/verify-otp', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter parameter is not an email.'),
    body('otp')
        .exists()
        .withMessage('Otp parameter is required.')
        .isString()
        .withMessage('Otp parameter must be a string.')
        .isLength({ min: 6, max: 6 })
        .withMessage('Otp parameter must be exactly 6 digits.')
        .isNumeric()
        .withMessage('Otp parameter must contain only numbers.'),
], verifyOtp);

/**
 * @swagger
 * /auth/reset-password/confirm:
 *   post:
 *     summary: Confirm reset password 
 *     description: Complete reset password procedure providing a new password.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User new password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Password'
 *     responses:
 *       200:
 *         description: User password reset successfully
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
router.post('/reset-password/confirm', authenticate, [
    body('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required.')
        .isString()
        .withMessage('NewPassword parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#.')
], resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out user 
 *     description: Log out user by blacklisting its onw access and refresh tokens
 *     tags:
 *       - Auth
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
 *         description: User logged out successfully
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
router.post('/logout', authenticate, [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], logout);

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify authentication 
 *     description: Verify user authentication by checking its onw access token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User is authenticated
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
 */
router.post('/verify', authenticate, (_req, res) => {
    res.json({ message: "User is authenticated" })
});
    
module.exports = router;