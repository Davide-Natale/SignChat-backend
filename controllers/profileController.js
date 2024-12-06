'use strict';

const { Sequelize } = require('sequelize');
const User = require('../models/user');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isDeaf: user.isDeaf
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, isDeaf } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) res.status(404).json({ message: 'User not found' });

        //  Check if email is already used
        const checkEmail = await User.findOne({ 
            where: { 
                email, 
                id: { [Sequelize.OP.ne]: userId }
            }
        });

        if(checkEmail) res.status(409).json({ message: 'Email already exists'});

        //  Check if phone number is already used
        const checkPhone = await User.findOne({
            where: {
                phone,
                id: { [Sequelize.OP.ne]: userId }
            }
        });

        if(checkPhone) res.status(409).json({ message: 'Phone numbr already exists'});

        await user.update({firstName, lastName, phone, isDeaf});

        res.json({ 
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                isDeaf: user.isDeaf
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error });
    }
};

exports.deleteProfile = async (req, res) => { 
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = User.findByPk(userId);
        if(!user) res.status(404).json({ message: 'User not found' });

        await user.destroy();

        //  TODO: add token blacklisting
        res.json({ message: 'Profile deleted successfully' });
    } catch(error) {
        res.status(500).json({ message: 'Error deleting profile', error: error });
    }
};