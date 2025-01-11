const { Sequelize } = require("sequelize");
const Contact = require("../models/contact");
const User = require("../models/user");
const { validationResult } = require('express-validator');

exports.getContacts = async (req, res) => {
    const userId = req.user.id

    try {
        //  Search contacts in the database
        const contacts = await Contact.findAll({
            where: { ownerId: userId },
            attributes: ['id', 'firstName', 'lastName', 'phone'],
            include: {
                model: User,
                attributes: ['id', 'imageProfile'],
                as: 'user'
            }
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

    try {
        //  Check if contact already exists
        const contact = await Contact.findOne({
            where: { phone, ownerId: userId }
        });

        if(contact) {
            return res.status(409).json({ message: 'Contact already exists.' });
        }

        const contactUser = await User.findOne({ where: { phone } });

        //  Add new contact to database
        const newContact = await Contact.create({ 
            id, 
            firstName, 
            lastName,
            phone,
            ownerId: userId,
            userId: contactUser? contactUser.id : null
        });

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

    try {
        //  Search contact in the database
        const contact = await Contact.findOne({
            where: { id: contactId, ownerId: userId }
        });

        if(!contact) {
            return res.status(404).json({ message: 'Contact not found.' });
        }

        //  Check if user has already a contact associated to phone
        const checkPhone = await Contact.findOne({
            where: {
                phone,
                ownerId: userId,
                id: { [Sequelize.Op.ne]: contactId }
            }
        });

        if(checkPhone) {
            return res.status(409).json({ message: 'A contact with this phone number already exists.' });
        }

        const contactUser = await User.findOne({ where: { phone } });

        await contact.update({ 
            firstName,
            lastName,
            phone,
            userId: contactUser? contactUser.id : null
        })

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
        res.status(500).json({ message: 'Error updating contact.', error });
    }
};

exports.deleteContact = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const contactId = req.params.id

    try {
        //  Search contact in the database
        const contact = await Contact.findOne({
            where: { id: contactId, ownerId: userId }
        });

        if(!contact) {
            return res.status(404).json({ message: 'Contact not found.' });
        }

        //  Delete contact from database
        await contact.destroy();

        res.json({ message: 'Contact deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting contact.', error });
    }
};

exports.syncContacts = async (req, res) => {
    /**TODO: implement it */
};

/*
const syncContacts = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, newContacts, updatedContacts, deletedContacts } = req.body;

    // Validate that the arrays are provided and in the correct format
    if (!Array.isArray(newContacts) || !Array.isArray(updatedContacts) || !Array.isArray(deletedContacts)) {
        return res.status(400).json({ error: 'newContacts, updatedContacts, and deletedContacts must be arrays' });
    }

    const transaction = await sequelize.transaction(); // Start a transaction

    try {
        // Handle new contacts (create new ones)
        for (let contact of newContacts) {
            const { id, firstName, lastName, phone } = contact;
            await Contact.create(
                { id, firstName, lastName, phone, ownerId: userId },
                { transaction } // Pass the transaction to each operation
            );
        }

        // Handle updated contacts (update existing ones)
        for (let contact of updatedContacts) {
            const { id, firstName, lastName, phone } = contact;
            const existingContact = await Contact.findOne({
                where: { id, ownerId: userId },
                transaction // Pass the transaction here
            });

            if (existingContact) {
                existingContact.firstName = firstName;
                existingContact.lastName = lastName;
                existingContact.phone = phone;
                await existingContact.save({ transaction });
            } else {
                return res.status(404).json({ error: `Contact with ID ${id} not found for user ${userId}` });
            }
        }

        // Handle deleted contacts (delete them from the database)
        const deletedContactIds = deletedContacts.map(contact => contact.id);
        await Contact.destroy({
            where: {
                ownerId: userId,
                id: { [Op.in]: deletedContactIds }
            },
            transaction // Pass the transaction here
        });

        // If everything goes well, commit the transaction
        await transaction.commit();

        return res.status(200).json({ message: 'Contacts synchronized successfully' });
    } catch (error) {
        console.error(error);

        // In case of error, rollback the transaction to avoid partial updates
        await transaction.rollback();

        return res.status(500).json({ error: 'An error occurred while syncing contacts' });
    }
};*/