'use strict';

const express = require('express');
const { check } = require('express-validator');
const { getProfile, updateProfile, deleteProfile } = require('../controllers/profileController');
const authenticate = require('../middlewares/authMiddleware')

const router = express.Router();

router.get('/profile', authenticate, getProfile);

router.put('/profile', authenticate, [
    check('firstName')
        .exists()
        .withMessage('FirstName parameter is required')
        .isString()
        .withMessage('FirstName parameter must be a string')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string'),
    check('lastName')
        .exists()
        .withMessage('LastName parameter is required')
        .isString()
        .withMessage('LastName parameter must be a string')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string'),
    check('email')
        .exists()
        .withMessage('Email parameter is required')
        .isString()
        .withMessage('Email parameter must be a string')
        .isEmail()
        .withMessage('Email parameter parameter is not an email'),
    check('phone')
        .exists()
        .withMessage('Phone parameter is required')
        .isString()
        .withMessage('Phone parameter must be a string')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters')
], updateProfile);

router.delete('/profile', authenticate, [
    check('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required')
        .isString()
        .withMessage('RefreshToken parameter must be a string')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string")
], deleteProfile);

module.exports = router;