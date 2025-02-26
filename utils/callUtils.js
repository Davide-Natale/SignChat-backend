'use strict';

const Token = require('../models/token');
const sendPushNotification = require('../utils/pushNotifications');
const sequelize = require("../config/database");
const Contact = require('../models/contact');
const User = require("../models/user");
const Call = require('../models/call');

//  TODO: remove logging when test completed
const endCall = async (callId, otherUserId, activeUsers, userId, io) => {;
    const user = activeUsers.get(userId);
    const otherUser = activeUsers.get(otherUserId);

    if(!user.activeCalls.has(otherUserId)) {
        throw new Error('Call not found.');
    }

    //  Start a new transaction
    const transaction = await sequelize.transaction();

    try {
        let otherUserSocketId;
        const userCall = user.activeCalls.get(otherUserId);
        const userSocketId = userCall.socketId; 
        const isCallRinging = userCall.status === 'ringing';

        //  Search calls in the database
        const userCallData = await Call.findOne({ where: { id: callId, ownerId: userId }, transaction });
        const otherUserCallData = await Call.findOne({
            where: {
                ownerId: otherUserId,
                userId,
                status: 'ongoing'
            }, transaction
        });

        if(!userCallData || userCallData.status !== 'ongoing' || !otherUserCallData) {
            throw new Error('Call not found or already ended.');
        } 

        if(isCallRinging) {
            //  Update user call in the database
            await userCallData.update({ status: 'unanswered' }, { transaction });

            //  Update other user call in the database
            await otherUserCallData.update({ status: 'missed' }, { transaction });

            //  Read contact of other user from database
            const otherUserContact = await Contact.findOne({
                where: { ownerId: otherUserId, userId },
                attributes: ['id', 'firstName', 'lastName', 'phone'],
                include: {
                    model: User,
                    attributes: ['id', 'imageProfile'],
                    as: 'user'
                },
                transaction
            });

            //  Read user data from database
            const userData = await User.findOne({
                where: { id: userId },
                attributes: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
                transaction
            });

            //  Read other user fcmTokens from database
            const fcmTokens = (await Token.findAll({
                where: { ownerId: otherUserId },
                attributes: ['fcmToken'],
                transaction,
                raw: true
            })).map(t => t.fcmToken);

            //  Update user status and corresponding active calls
            clearTimeout(userCall.timeout);
            user.activeCalls.delete(otherUserId);
            activeUsers.set(userId, { ...user, status: 'available' });

            //  Notify other user
            await sendPushNotification(fcmTokens, {
                callId: otherUserCallData.id.toString(),
                type: "incoming-call-handled" 
            });

            setTimeout(() => {
                sendPushNotification(fcmTokens, {
                    notifee: JSON.stringify({
                        title: otherUserContact ? `${otherUserContact.firstName} ${otherUserContact.lastName || ''}`.trim() :
                            userData.phone,
                        body: 'Missed Call',
                        imageProfile: otherUserContact ? otherUserContact.user.imageProfile : userData.imageProfile,
                        data: {
                            callId: otherUserCallData.id,
                            type: 'missed-call'
                        }
                    })
                });
            }, 2000);
        } else {
            if(!otherUser || !otherUser.activeCalls.has(userId)) {
                throw new Error('User not found.');
            }

            //  Update user call in the database
            await userCallData.update({ status: 'completed' }, { transaction });

            //  Update other user call in the database
            await otherUserCallData.update({ status: 'completed' }, { transaction });

            //  Update both users status and corresponding active calls
            user.activeCalls.delete(otherUserId);
            activeUsers.set(userId, { ...user, status: 'available' });

            const otherUserCall = otherUser.activeCalls.get(userId);
            otherUserSocketId = otherUserCall.socketId
            otherUser.activeCalls.delete(userId);
            activeUsers.set(otherUserId, { ...otherUser, status: 'available' });
        }

        //  Some Logging
        activeUsers.entries().forEach(([key, userData]) => {
            console.log(key);
            console.log(userData);
        });

        //  Commit transaction
        await transaction.commit();

        if(!isCallRinging) { 
            io.to(otherUserSocketId).emit('call-ended', { reason: 'completed' }); 
        }

        io.to(userSocketId).emit('call-ended', { reason: 'completed' });
    } catch (error) {
        //  Rollback transaction in case of error
        await transaction.rollback();

        throw error;
    }
};

module.exports = { endCall };