const { Sequelize } = require('sequelize');
const Call = require('../models/call');
const Contact = require("../models/contact");
const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.getCalls = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { contactId, userId: queryUserId, limit } = req.query;

    try {
        const whereClause = { ownerId: userId };

        if(contactId) {
            whereClause.contactId = contactId;
        } else if(queryUserId) {
            whereClause.userId = queryUserId
        }

        //  Search calls in the database
        const calls = await Call.findAll({
            where: whereClause,
            attributes: ['id', 'phone', 'type', 'date', 'duration'],
            include: [
                {
                    model: Contact,
                    attributes: ['id', 'firstName', 'lastName', 'phone'],
                    include: {
                        model: User,
                        attributes: ['id', 'imageProfile'],
                        as: 'user'  
                    },
                    where: { ownerId: userId },
                    required: false,
                    as: 'contact'
                },
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
                    where: Sequelize.literal('Call.contactId IS NULL'),
                    required: false,
                    as: 'user'
                },
            ],
            order: [['date', 'DESC']],
            limit
        });

        res.json({ calls });
    } catch (error) {
        res.status(500).json({ message: "Error fetching calls.", error });
    }
};

exports.deleteCalls = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { ids } = req.body;

    try {
        //  Delete calls from database
        await Call.destroy({ 
            where: { 
                id: { [Sequelize.Op.in]: ids },
                ownerId: userId
            } 
        });

        res.json({ message: 'Calls deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting calls.', error });
    }
};