'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, deleteProfile, uploadProfileImage, deleteProfileImage } = require('../controllers/profileController');
const authenticate = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/profile', authenticate, getProfile);

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

router.delete('/profile', authenticate, [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], deleteProfile);

router.post('/profile/image', authenticate, upload.single('image'), uploadProfileImage);

router.delete('/profile/image', authenticate, deleteProfileImage);

module.exports = router;