'use strict';

const express = require('express');
const { check } = require('express-validator');
const { getContacts, getContact, createContact, updateContact, deleteContact } = require('../controllers/contactsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/contacts', authenticate, getContacts);

router.get('/contacts/:id', authenticate, [
    check('id')
        .isUUID()
        .withMessage('Invalid id.')
], getContact);

router.post('/contacts', authenticate, createContact);

router.put('/contacts/:id', authenticate, updateContact);

router.delete('/contacts/:id', authenticate, deleteContact);

//router.post('/contacts/sync', authenticate, syncContacts);

module.exports = router;