'use strict';

const { Sequelize, where } = require('sequelize');
const User = require('../models/user');
const { sendEmail, getDeleteAccountMessage } = require('../utils/emailUtils');
const { blacklistToken, isTokenBlacklisted } = require('../utils/blacklistUtils');
const { validationResult } = require('express-validator');
const sequelize = require("../config/database");
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const { use } = require('../routes/profileRoutes');
const Contact = require('../models/contact');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            imageProfile: user.imageProfile
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile.', error });
    }
};

exports.updateProfile = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { firstName, lastName, email, phone } = req.body;

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        //  Search user in the database
        const user = await User.findByPk(userId, { transaction });
        if(!user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'User not found.' });
        }

        const oldPhone = user.phone;
        const isPhoneChanged = phone !== user.phone;
        const isEmailChanged = email !== user.email

        if (isEmailChanged) {
            //  Check if email is already used
            const checkEmail = await User.findOne({
                where: {
                    email,
                    id: { [Sequelize.Op.ne]: userId }
                }, 
                transaction
            });

            if(checkEmail) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Email already used.' }); 
            }
        }

        if (isPhoneChanged) {
            //  Check if phone number is already used
            const checkPhone = await User.findOne({
                where: {
                    phone,
                    id: { [Sequelize.Op.ne]: userId }
                },
                transaction
            });

            if(checkPhone) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Phone number already used.' });
            }
        }   

        await user.update({ firstName, lastName, email, phone }, { transaction });

        if(isPhoneChanged) {
            if(oldPhone) {
                //  Update contacts associated to old phone number
                await Contact.update(
                    { userId: null },
                    { where: { phone: oldPhone }, transaction }
                );
            }
            
            //  Update contacts associated to new phone number
            await Contact.update(
                { userId },
                { where: { phone }, transaction }
            );
        }

        //  Commit transaction
        await transaction.commit();

        res.json({
            message: 'Profile updated successfully.',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                imageProfile: user.imageProfile
            }
        });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();
        res.status(500).json({ message: 'Error updating profile.', error });
    }
};

exports.deleteProfile = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const accessToken = req.headers['authorization'].split(' ')[1];
    const { refreshToken } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Check if refresh token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(refreshToken);
        if(isBlacklisted) 
            return res.status(401).json({ message: 'Refresh token is blacklisted.' });

        //  Verify access and refresh token
        const accessPayload = jwt.verify(accessToken, process.env.JWT_SECRET);
        const refreshPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        //  Save user email before deletion to send email confirmation
        const email = user.email;

        //  Delete profile image if exists
        if(user.imageProfile) {
            const imageFileName = user.imageProfile.split('/uploads/')[1];
            const imageFilePath = path.join(__dirname, '..', 'uploads', imageFileName);

            if(fs.existsSync(imageFilePath)) {
                fs.unlinkSync(imageFilePath);
            }
        } 

        //  Delete user from database
        await user.destroy();

        // Blacklist both access and refresh token
        const currentTime = dayjs();
        const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
        const refreshTokenTTL = dayjs.unix(refreshPayload.exp).diff(currentTime, 'second');

        await blacklistToken(accessToken, accessTokenTTL);
        await blacklistToken(refreshToken, refreshTokenTTL);

        
        //  Send confirmation email for profile delation
        sendEmail({
            to: email, 
            subject: 'Account Deletion Confirmation',
            html: getDeleteAccountMessage()
          });

        res.json({ message: 'Profile deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profile.', error });
    }
};

exports.uploadProfileImage = async (req, res) => {
    const userId = req.user.id;

    if(!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const imagePath = req.file.path;
    const imageUrl = `http://192.168.178.183:${process.env.PORT}` + '/uploads/' +
        imagePath.split(path.sep + 'uploads' + path.sep)[1];

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Delete old profile image, if exists
        if(user.imageProfile) {
            const imageFileName = user.imageProfile.split('/uploads/')[1];
            const imageFilePath = path.join(__dirname, '..', 'uploads', imageFileName);

            if(fs.existsSync(imageFilePath)) {
                fs.unlinkSync(imageFilePath);
            }
        }

        //  Update user
        await user.update({ imageProfile: imageUrl });

        res.json({ message: 'Profile image uploaded successfully.'});
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile image.', error });
    }
};

exports.deleteProfileImage = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Check if user has a profile image
        if(!user.imageProfile) {
            return res.status(400).json({ message: 'No profile image to delete.' });
        }

        //  Delete profile image file
        const imageFileName = user.imageProfile.split('/uploads/')[1];
        const imageFilePath = path.join(__dirname, '..', 'uploads', imageFileName);

        if(fs.existsSync(imageFilePath)) {
            fs.unlinkSync(imageFilePath);
        }

        //  Update user
        await user.update({ imageProfile: null });

        res.json({ message: 'Profile image deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profile image.', error });
    }
};