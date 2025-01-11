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
        .optional({ values: "null" })
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
        .optional({ values: "null" })
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

/*const { body, validationResult } = require('express-validator');

const validateSyncContacts = [
    body('newContacts')
        .isArray()
        .withMessage('newContacts must be an array')
        .custom((value) => value.every(contact => contact.id && contact.firstName && contact.phone))
        .withMessage('Each contact in newContacts must have id, firstName, and phone'),

    body('updatedContacts')
        .isArray()
        .withMessage('updatedContacts must be an array')
        .custom((value) => value.every(contact => contact.id && contact.firstName && contact.phone))
        .withMessage('Each contact in updatedContacts must have id, firstName, and phone'),

    body('deletedContacts')
        .isArray()
        .withMessage('deletedContacts must be an array')
        .custom((value) => value.every(contact => contact.id))
        .withMessage('Each contact in deletedContacts must have id')
];*/

/*
const { body, validationResult } = require('express-validator');

const validateSyncContacts = [
    // Validate newContacts array
    body('newContacts')
        .isArray()
        .withMessage('newContacts must be an array')
        .custom((value) => {
            return value.every(contact => {
                return (
                    // Validate the contact's id
                    typeof contact.id === 'string' && contact.id.trim().length > 0 &&
                    // Validate the contact's firstName
                    typeof contact.firstName === 'string' && contact.firstName.trim().length > 0 &&
                    // Validate the contact's phone
                    typeof contact.phone === 'string' && contact.phone.trim().length > 0 && /^[0-9]+$/.test(contact.phone)
                );
            });
        })
        .withMessage('Each contact in newContacts must have valid id, firstName, and phone'),

    // Validate updatedContacts array
    body('updatedContacts')
        .isArray()
        .withMessage('updatedContacts must be an array')
        .custom((value) => {
            return value.every(contact => {
                return (
                    // Validate the contact's id
                    typeof contact.id === 'string' && contact.id.trim().length > 0 &&
                    // Validate the contact's firstName
                    typeof contact.firstName === 'string' && contact.firstName.trim().length > 0 &&
                    // Validate the contact's phone
                    typeof contact.phone === 'string' && contact.phone.trim().length > 0 && /^[0-9]+$/.test(contact.phone)
                );
            });
        })
        .withMessage('Each contact in updatedContacts must have valid id, firstName, and phone'),

    // Validate deletedContacts array (only id is required)
    body('deletedContacts')
        .isArray()
        .withMessage('deletedContacts must be an array')
        .custom((value) => {
            return value.every(contact => typeof contact.id === 'string' && contact.id.trim().length > 0);
        })
        .withMessage('Each contact in deletedContacts must have a valid id')
];*/


module.exports = router;