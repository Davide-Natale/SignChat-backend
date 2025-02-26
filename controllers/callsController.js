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
            attributes: ['id', 'phone', 'type', 'status', 'date', 'duration'],
            include: [
                {
                    model: Contact,
                    attributes: ['id', 'firstName', 'lastName', 'phone'],
                    include: {
                        model: User,
                        attributes: ['id', 'imageProfile'],
                        as: 'user'  
                    },
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

exports.getCall = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const callId = req.params.id;

    try {
        //  Search call in the database
        const call = await Call.findOne({
            where: { id: callId, ownerId: userId },
            attributes: ['id', 'phone', 'type', 'status', 'date', 'duration'],
            include: [
                {
                    model: Contact,
                    attributes: ['id', 'firstName', 'lastName', 'phone'],
                    include: {
                        model: User,
                        attributes: ['id', 'imageProfile'],
                        as: 'user'  
                    },
                    as: 'contact'
                },
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
                    where: Sequelize.literal('Call.contactId IS NULL'),
                    required: false,
                    as: 'user'
                },
            ]
        });

        if(!call) {
            return res.status(404).json({ message: 'Call not found.' });
        }

        res.json({ call });
    } catch (error) {
        res.status(500).json({ message: "Error fetching call.", error });
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
                ownerId: userId,
                status: { [Sequelize.Op.ne]: 'ongoing' }
            }
        });

        res.json({ message: 'Calls deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting calls.', error });
    }
};