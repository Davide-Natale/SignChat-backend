'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const { getContacts, getContact, createContact, updateContact, deleteContact, syncContacts } = require('../controllers/contactsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/contacts', authenticate, getContacts);

router.get('/contacts/:id', authenticate, [
    param('id')
        .isUUID()
        .withMessage('Invalid id.')
], getContact);

router.post('/contacts', authenticate, [
    body('id')
        .isUUID()
        .withMessage('Invalid id.'),
    body('firstName')
        .exists()
        .withMessage('FirstName parameter is required')
        .isString()
        .withMessage('FirstName parameter must be a string')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string'),
    body('lastName')
        .optional()
        .isString()
        .withMessage('LastName parameter must be a string')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string'),
    body('phone')
        .exists()
        .withMessage('Phone parameter is required')
        .isString()
        .withMessage('Phone parameter must be a string')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters')
], createContact);

router.put('/contacts/:id', authenticate, [
    param('id')
        .isUUID()
        .withMessage('Invalid id.'),
    body('firstName')
        .exists()
        .withMessage('FirstName parameter is required')
        .isString()
        .withMessage('FirstName parameter must be a string')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string'),
    body('lastName')
        .optional()
        .isString()
        .withMessage('LastName parameter must be a string')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string'),
    body('phone')
        .exists()
        .withMessage('Phone parameter is required')
        .isString()
        .withMessage('Phone parameter must be a string')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters')
], updateContact);

router.delete('/contacts/:id', authenticate, [
    param('id')
        .isUUID()
        .withMessage('Invalid id.')
], deleteContact);

//  TODO: implement and test it

router.post('/contacts/sync', authenticate, syncContacts);

module.exports = router;