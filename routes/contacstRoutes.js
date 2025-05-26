'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const { getContacts, getContact, createContact, updateContact, deleteContact, syncContacts } = require('../controllers/contactsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts 
 *     description: Retreive all contacts that belong to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contacts associated to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - contacts
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     allOf:
 *                       - type: object
 *                         required:
 *                           - id
 *                         properties:
 *                           id:
 *                             $ref: '#/components/schemas/Id'
 *                       - $ref: '#/components/schemas/Contact'
 *                       - type: object
 *                         required:
 *                           - user
 *                         properties:
 *                           user:
 *                             type: object
 *                             nullable: true
 *                             required:
 *                               - id
 *                               - imageProfile
 *                             properties: 
 *                               id:
 *                                 $ref: '#/components/schemas/Id'
 *                               imageProfile:
 *                                 $ref: '#/components/schemas/ImageProfile'
 *       401:
 *         description: User unauthorized
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
router.get('/contacts', authenticate, getContacts);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get contact by id 
 *     description: Retreive a specific contact by id that belong to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Id'
 *     responses:
 *       200:
 *         description: Contact information associated to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - contact
 *               properties:
 *                 contact:
 *                   type: object
 *                   allOf:
 *                     - type: object
 *                       required:
 *                         - id
 *                       properties:
 *                         id:
 *                           $ref: '#/components/schemas/Id'
 *                     - $ref: '#/components/schemas/Contact'
 *                     - type: object
 *                       required:
 *                         - user
 *                       properties:
 *                         user:
 *                           type: object
 *                           nullable: true
 *                           required:
 *                             - id
 *                             - imageProfile
 *                           properties: 
 *                             id:
 *                               $ref: '#/components/schemas/Id'
 *                             imageProfile:
 *                               $ref: '#/components/schemas/ImageProfile'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Contact not found
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
router.get('/contacts/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getContact);

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact 
 *     description: Create a new contact associated to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: New contact information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       201:
 *         description: New contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf: 
 *                 - $ref: '#/components/schemas/Message'
 *                 - type: object
 *                   required: 
 *                     - contact
 *                   properties: 
 *                     contact:
 *                       type: object
 *                       allOf:
 *                         - type: object
 *                           required:
 *                             - id
 *                           properties:
 *                             id:
 *                               $ref: '#/components/schemas/Id'
 *                         - $ref: '#/components/schemas/Contact'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       409:
 *         description: Contact already exists
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

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Update a contact by id
 *     description: Update contact information by id associated to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Id'
 *     requestBody:
 *       description: Updated contact information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf: 
 *                 - $ref: '#/components/schemas/Message'
 *                 - type: object
 *                   required: 
 *                     - contact
 *                   properties: 
 *                     contact:
 *                       type: object
 *                       allOf:
 *                         - type: object
 *                           required:
 *                             - id
 *                           properties:
 *                             id:
 *                               $ref: '#/components/schemas/Id'
 *                         - $ref: '#/components/schemas/Contact'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       409:
 *         description: Contact phone number already exists
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

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact by id
 *     description: Delete a contact by id associated to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Id'
 *     responses:
 *       200:
 *         description: Contact deleted successfully
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
 *         description: Contact not found
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
router.delete('/contacts/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], deleteContact);

/**
 * @swagger
 * /contacts/sync:
 *   post:
 *     summary: Sync local contacts information
 *     description: Sync local contacts information to contacts associated to the authenticated user
 *     tags:
 *       - Contacts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Local contacts to be synched
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newContacts
 *               - updatedContacts
 *               - deletedContacts
 *             properties:
 *               newContacts:
 *                 type: array
 *                 description: List of local new contacts to be created (can be empty)
 *                 items:
 *                   $ref: '#/components/schemas/Contact'
 *               updatedContacts:
 *                 type: array
 *                 description: List of local updated contacts to be synced (can be empty)
 *                 items:  
 *                   $ref: '#/components/schemas/Contact'
 *               deletedContacts:
 *                 type: array
 *                 description: List of local contact phone numbers to be deleted (can be empty)
 *                 items:
 *                   type: string
 *                   example: 1234567890
 *     responses:
 *       200:
 *         description: Contacts synchronized successfully
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
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       409:
 *         description: Contact already exists
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