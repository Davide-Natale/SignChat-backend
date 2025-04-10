'use strict';

const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.getUser = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['email', 'password'] }
        });

        if(!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user.", error });
    }
};