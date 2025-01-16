const { Sequelize } = require("sequelize");
const Contact = require("../models/contact");
const User = require("../models/user");
const Call = require('../models/call');
const { validationResult } = require('express-validator');
const sequelize = require("../config/database");

exports.getContacts = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search contacts in the database
        const contacts = await Contact.findAll({
            where: { ownerId: userId },
            attributes: ['id', 'firstName', 'lastName', 'phone'],
            include: {
                model: User,
                attributes: ['id', 'imageProfile'],
                as: 'user'
            },
            order:[
                ['firstName', 'ASC'],
                ['lastName', 'ASC']
            ]
        });

        res.json({ contacts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching contacts.", error });
    }
};

exports.getContact = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const contactId = req.params.id

    try {
        //  Search contact in the database
        const contact = await Contact.findOne({
            where: { id: contactId, ownerId: userId },
            attributes: ['id', 'firstName', 'lastName', 'phone'],
            include: {
                model: User,
                attributes: ['id', 'imageProfile'],
                as: 'user'
            }
        });

        if(!contact) {
            return res.status(404).json({ message: 'Contact not found.' });
        }

        res.json({ contact });
    } catch (error) {
        res.status(500).json({ message: "Error fetching contact.", error });
    }
};

exports.createContact = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { id, firstName, lastName, phone } = req.body;

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        //  Check if contact already exists
        const contact = await Contact.findOne({
            where: { phone, ownerId: userId },
            transaction
        });

        if(contact) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Contact already exists.' });
        }

        const contactUser = await User.findOne({ where: { phone }, transaction });

        //  Add new contact to database
        const newContact = await Contact.create({ 
            id, 
            firstName, 
            lastName,
            phone,
            ownerId: userId,
            userId: contactUser? contactUser.id : null
        }, { transaction });

        //  Update calls associated to new contact
        await Call.update(
            { contactId: id, contactOwnerId: userId },
            { 
                where: { phone, ownerId: userId }, 
                transaction 
            }
        );

        //  Commit transaction
        await transaction.commit();

        res.status(201).json({
            message: 'Contact created successfully.',
            contact: {
                id: newContact.id,
                firstName: newContact.firstName,
                lastName: newContact.lastName,
                phone: newContact.phone
            }
        });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();
        res.status(500).json({ message: 'Error creating contact.', error });
    }
};

exports.updateContact = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const contactId = req.params.id;
    const { firstName, lastName, phone } = req.body;

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        //  Search contact in the database
        const contact = await Contact.findOne({
            where: { id: contactId, ownerId: userId },
            transaction
        });

        if(!contact) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Contact not found.' });
        }

        const oldPhone = contact.phone;
        const isPhoneChanged = phone !== contact.phone;
        let contactUserId = contact.userId;

        if(isPhoneChanged) {
            //  Check if user has already a contact associated to phone
            const checkPhone = await Contact.findOne({
                where: {
                    phone,
                    ownerId: userId,
                    id: { [Sequelize.Op.ne]: contactId }
                }, transaction
            });

            if(checkPhone) {
                await transaction.rollback();
                return res.status(409).json({ message: 'A contact with this phone number already exists.' });
            }

            const contactUser = await User.findOne({ where: { phone }, transaction });
            contactUserId = contactUser? contactUser.id : null;
        }

        await contact.update({ 
            firstName,
            lastName,
            phone,
            userId: contactUserId
        }, { transaction })

        if(isPhoneChanged) {
            //  Update calls associated to old phone number
            await Call.update(
                { contactId: null, contactOwnerId: null },
                { 
                    where: { phone: oldPhone, ownerId: userId }, 
                    transaction 
                }
            );

            //  Update calls associated to new phone number
            await Call.update(
                { contactId, contactOwnerId: userId },
                { 
                    where: { phone, ownerId: userId }, 
                    transaction
                }
            );
        }

        //  Commit transaction
        await transaction.commit();

        res.json({
            message: 'Contact updated successfully.',
            contact: {
                id: contact.id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                phone: contact.phone
            }
        });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();
        res.status(500).json({ message: 'Error updating contact.', error });
    }
};

exports.deleteContact = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const contactId = req.params.id;

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        //  Search contact in the database
        const contact = await Contact.findOne({
            where: { id: contactId, ownerId: userId }, 
            transaction
        });

        if(!contact) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Contact not found.' });
        }

        //  Delete contact from database
        await contact.destroy({ transaction });

        //  Update calls associated to deleted contact
        await Call.update(
            { contactId: null, contactOwnerId: null },
            {
                where: { ownerId: userId, contactId, contactOwnerId: userId },
                transaction
            }
        );

        //  Commit transaction
        await transaction.commit();

        res.json({ message: 'Contact deleted successfully.' });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();
        res.status(500).json({ message: 'Error deleting contact.', error });
    }
};

exports.syncContacts = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { newContacts, updatedContacts, deletedContacts } = req.body;

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        //  Handle new contacts
        for(let newContact of newContacts) {
            const { id, firstName, lastName, phone } = newContact;

            //  Check if contact already exists
            const contact = await Contact.findOne({
                where: { phone, ownerId: userId },
                transaction
            });

            if(contact) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Contact already exists.' });
            }

            const contactUser = await User.findOne({ where: { phone }, transaction });

            //  Add new contact to database
            await Contact.create({ 
                id, 
                firstName, 
                lastName,
                phone,
                ownerId: userId,
                userId: contactUser? contactUser.id : null
            }, { transaction });

            //  Udpdate calls associated to new contact
            await Call.update(
                { contactId: id, contactOwnerId: userId },
                { 
                    where: { phone, ownerId: userId }, 
                    transaction 
                }
            );
        }

        //  Handle updated contacts
        for (let updatedContact of updatedContacts) {
            const { id, firstName, lastName, phone } = updatedContact;

            //  Search contact in the database
            const contact = await Contact.findOne({
                where: { id, ownerId: userId },
                transaction
            });

            if (!contact) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Contact not found.' });
            }

            const oldPhone = contact.phone;
            const isPhoneChanged = phone !== contact.phone;
            let contactUserId = contact.userId;

            if (isPhoneChanged) {
                //  Check if user has already a contact associated to phone
                const checkPhone = await Contact.findOne({
                    where: {
                        phone,
                        ownerId: userId,
                        id: { [Sequelize.Op.ne]: id }
                    },
                    transaction
                });

                if (checkPhone) {
                    await transaction.rollback();
                    return res.status(409).json({ message: 'A contact with this phone number already exists.' });
                }

                const contactUser = await User.findOne({ where: { phone }, transaction });
                contactUserId = contactUser ? contactUser.id : null;
            }

            await contact.update({
                firstName,
                lastName,
                phone,
                userId: contactUserId
            }, { transaction });

            if (isPhoneChanged) {
                //  Update calls associated to old phone number
                await Call.update(
                    { contactId: null, contactOwnerId: null },
                    {
                        where: { phone: oldPhone, ownerId: userId },
                        transaction
                    }
                );

                //  Update calls associated to new phone number
                await Call.update(
                    { contactId: id, contactOwnerId: userId },
                    {
                        where: { phone, ownerId: userId },
                        transaction
                    }
                );
            }
        }

        //  Handle deleted contacts
        if(deletedContacts.length > 0) {
            await Contact.destroy({
                where: {
                    id: { [Sequelize.Op.in]: deletedContacts },
                    ownerId: userId
                }, 
                transaction
            });

            //  Update calls associated to deleted contacts
            await Call.update(
                { contactId: null, contactOwnerId: null },
                {
                    where: { 
                        contactId: { [Sequelize.Op.in]: deletedContacts },
                        ownerId: userId,
                        contactOwnerId: userId
                    },
                    transaction
                }
            );
        }

        //  Commit transaction
        await transaction.commit();

        res.json({ message: 'Contacts synchronized successfully.' });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();
        res.status(500).json({ message: 'Error synchronizing contacts.', error });        
    }
};