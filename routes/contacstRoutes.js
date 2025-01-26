'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const { getContacts, getContact, createContact, updateContact, deleteContact, syncContacts } = require('../controllers/contactsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/contacts', authenticate, getContacts);

router.get('/contacts/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getContact);

router.post('/contacts', authenticate, [
    body('firstName')
        .exists()
        .withMessage('FirstName parameter is required.')
        .isString()
        .withMessage('FirstName parameter must be a string.')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string.'),
    body('lastName')
        .optional({ values: "null" })
        .isString()
        .withMessage('LastName parameter must be a string.')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string.'),
    body('phone')
        .exists()
        .withMessage('Phone parameter is required.')
        .isString()
        .withMessage('Phone parameter must be a string.')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string.")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters.')
], createContact);

router.put('/contacts/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.'),
    body('firstName')
        .exists()
        .withMessage('FirstName parameter is required.')
        .isString()
        .withMessage('FirstName parameter must be a string.')
        .notEmpty()
        .withMessage('FirstName parameter cannot be an empty string.'),
    body('lastName')
        .optional({ values: "null" })
        .isString()
        .withMessage('LastName parameter must be a string.')
        .notEmpty()
        .withMessage('LastName parameter cannot be an empty string.'),
    body('phone')
        .exists()
        .withMessage('Phone parameter is required.')
        .isString()
        .withMessage('Phone parameter must be a string.')
        .notEmpty()
        .withMessage("Phone parameter cannot be an empty string.")
        .isNumeric()
        .withMessage('Phone parameter must contain only numeric characters.')
], updateContact);

router.delete('/contacts/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], deleteContact);

router.post('/contacts/sync', authenticate, [
    body('newContacts')
        .exists()
        .withMessage('NewContacts parameter is required.')
        .isArray()
        .withMessage('NewContacts parameter must be an array.'),
    body('newContacts.*.firstName')
        .exists()
        .withMessage('Each new contact must contain a firstName field.')
        .isString()
        .withMessage('New contact firstName field must be a string.')
        .notEmpty()
        .withMessage('New contact firstName field cannot be an empty string.'),
    body('newContacts.*.lastName')
        .optional({ values: "null" })
        .isString()
        .withMessage('New contact lastName field must be a string.')
        .notEmpty()
        .withMessage('New contact lastName field cannot be an empty string.'),
    body('newContacts.*.phone')
        .exists()
        .withMessage('Each new contact must contain a phone field.')
        .isString()
        .withMessage('New contact phone field must be a string.')
        .notEmpty()
        .withMessage('New contact phone field cannot be an empty string.')
        .isNumeric()
        .withMessage('New contact phone field must contain only numeric characters.'),
    body('updatedContacts')
        .exists()
        .withMessage('Updated Contacts parameter is required.')
        .isArray()
        .withMessage('Updated Contacts parameter must be an array.'),
    body('updatedContacts.*.firstName')
        .exists()
        .withMessage('Each updated contact must contain a firstName field.')
        .isString()
        .withMessage('Updated contact firstName field must be a string.')
        .notEmpty()
        .withMessage('Updated contact firstName field cannot be an empty string.'),
    body('updatedContacts.*.lastName')
        .optional({ values: "null" })
        .isString()
        .withMessage('Updated contact lastName field must be a string.')
        .notEmpty()
        .withMessage('Updated contact lastName field cannot be an empty string.'),
    body('updatedContacts.*.phone')
        .exists()
        .withMessage('Each updated contact must contain a phone field.')
        .isString()
        .withMessage('Updated contact phone field must be a string.')
        .notEmpty()
        .withMessage('Updated contact phone field cannot be an empty string.')
        .isNumeric()
        .withMessage('Updated contact phone field must contain only numeric characters.'),
    body('deletedContacts')
        .exists()
        .withMessage('Deleted Contacts parameter is required.')
        .isArray()
        .withMessage('Delete Contacts parameter must be an array.'),
    body('deletedContacts.*')
        .isString()
        .withMessage('Deleted Contacts must contain only string.')
        .notEmpty()
        .withMessage('Deleted Contacts cannot contain empty string.')
        .isNumeric()
        .withMessage('Deleted Contacts must contain only numeric string.')
], syncContacts);

module.exports = router;