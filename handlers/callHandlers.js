'use strict';

const Token = require('../models/token');
const sendPushNotification = require('../utils/pushNotifications');
const sequelize = require("../config/database");
const Contact = require('../models/contact');
const User = require("../models/user");
const Call = require('../models/call');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { Sequelize } = require("sequelize");
const { endCall } = require('../utils/callUtils');
//const mediasoup = require('./mediasoup');

dayjs.extend(utc);

//  TODO: remove logging when test completed
module.exports = (io, activeUsers, socket) => {
    const userId = socket.user.id;

    const onCallUser = async ({ targetUserId, targetPhone }) => {
        const callerUser = activeUsers.get(userId);

        //  Check if an active call already exists
        if(callerUser.status !== 'available') {
            return io.to(socket.id).emit('call-error', { message: 'An active call already exists.' });
        }    

        //  Start a new transaction
        const transaction = await sequelize.transaction();

        try {
            //  Search target user in the database
            const targetUser = await User.findByPk(targetUserId, { transaction });
            if(!targetUser) {
                //  Rollback transaction in case of error
                await transaction.rollback();

                return io.to(socket.id).emit('call-error', { message: 'User not found.' });
            }

            //  Read target user fcmTokens from database
            const fcmTokens = (await Token.findAll({
                where: { ownerId: targetUserId },
                attributes: ['fcmToken'],
                raw: true,
                transaction
            })).map(t => t.fcmToken);

            //  TODO: uncomment once tested
            /*if (fcmTokens.length === 0) {
                //  Rollback transaction in case of error
                await transaction.rollback();

                return io.to(socket.id).emit('call-error', { message: 'User unreachable.' });  
            }*/
            
            //  Read contact of caller user from database
            const callerUserContact = await Contact.findOne({
                where: { ownerId: userId, userId: targetUserId },
                attributes: ['id', 'phone'],
                transaction
            });

            //  Create a new ongoing call for caller user
            const callerUserCall = await Call.create({
                ownerId: userId,
                phone: callerUserContact ? callerUserContact.phone : targetPhone,
                type: 'outgoing',
                status: 'ongoing',
                date: dayjs().utc().format(),
                duration: 0,
                contactId: callerUserContact ? callerUserContact.id : null,
                userId: targetUserId
            }, { transaction });

            //  Read contact of target user from database
            const targetUserContact = await Contact.findOne({
                where: { ownerId: targetUserId, userId },
                attributes: ['id', 'firstName', 'lastName', 'phone'],
                include: {
                    model: User,
                    attributes: ['id', 'imageProfile'],
                    as: 'user'
                },
                transaction
            });

            //  Read caller user data from database
            const callerUserData = await User.findOne({
                where: { id: userId },
                attributes: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
                transaction
            });

            //  Create a new ongoing call for target user
            const targetUserCall = await Call.create({
                ownerId: targetUserId,
                phone: targetUserContact ? targetUserContact.phone : callerUserData.phone,
                type: 'incoming',
                status: 'ongoing',
                date: dayjs().utc().format(),
                duration: 0,
                contactId: targetUserContact ? targetUserContact.id : null,
                userId: callerUserData.id
            }, { transaction });

            //  Add new active call to callerUser and update its status
            callerUser.activeCalls.set(targetUserId, {
                callId: callerUserCall.id,
                socketId: socket.id,
                status: 'ringing',
                timeout: setTimeout(() => onUnansweredCall(
                        targetUserId,
                        targetUserContact ?? callerUserData,
                        callerUserCall.id,
                        targetUserCall.id, 
                        fcmTokens
                    ), 15000    //  TODO: change with 30 seconds
                )
            });

            activeUsers.set(userId, { ...callerUser, status: 'ringing' });

            //  Some Logging
            activeUsers.entries().forEach(([key, userData]) => {
                console.log(key);
                console.log(userData);
            });

            //  Notify targetUser of the incoming-call
            await sendPushNotification(fcmTokens, {
                type: "incoming-call",
                callId: targetUserCall.id.toString(),
                contact: targetUserContact ? JSON.stringify(targetUserContact) : undefined,
                user: !targetUserContact ? JSON.stringify(callerUserData) : undefined
            });
            
            //  Commit transaction
            await transaction.commit();

            io.to(socket.id).emit('call-started', { callId: callerUserCall.id });
        } catch (error) {
            console.log(error);
            //  Rollback transaction in case of error
            await transaction.rollback();

            io.to(socket.id).emit('call-error', { message: error.message });
        }
    };

    const onUnansweredCall = async (targetUserId, callerUserData, callerUserCallId, targetUserCallId, fcmTokens) => {
        const callerUser = activeUsers.get(userId); 
        
        //  Start a new transaction
        const transaction = await sequelize.transaction();

        try {
            //  Update caller call status in the database
            await Call.update({ status: 'unanswered' }, { where: { id: callerUserCallId }, transaction });
            
            //  Update target call status in the database
            await Call.update({ status: 'missed' }, { where: { id: targetUserCallId }, transaction });

            //  Remove active call from callerUser and update its status
            callerUser.activeCalls.delete(targetUserId);
            const newStatus = callerUser.activeCalls.size === 0 ? 'available' : callerUser.status;
            activeUsers.set(userId, { ...callerUser, status: newStatus });

            //  Some Logging
            activeUsers.entries().forEach(([key, userData]) => {
                console.log(key);
                console.log(userData);
            });

            //  Notify both caller and target users
            /*await sendPushNotification(fcmTokens, {
                type: "incoming-call-handled",
                callId: targetUserCallId.toString()
            });

            setTimeout(() => {
                sendPushNotification(fcmTokens, {
                    notifee: JSON.stringify({
                      title: callerUserData.user ? `${callerUserData.firstName} ${callerUserData.lastName || ''}`.trim() : 
                        callerUserData.phone,
                      body: 'Missed Call',
                      imageProfile: callerUserData.user ? callerUserData.user.imageProfile : callerUserData.imageProfile,
                      data: {
                        callId: targetUserCallId,
                        type: 'missed-call'
                      }
                    })
                });
            }, 2000);*/
            
            //  Commit transaction
            await transaction.commit();

            io.to(socket.id).emit('call-ended', { reason: 'unanswered' });
        } catch (error) {
            console.log(error);
            //  Rollback transaction in case of error
            await transaction.rollback();
        }
    };

    const onEndCall = async ({ callId, otherUserId }) => {
        try {
            await endCall(callId, otherUserId, activeUsers, userId, io);
        } catch (error) {
            console.log(error);
            io.to(socket.id).emit('call-error', { message: error.message });
        }
    };

    const onAnswerCall = async ({ callId, callerUserId, deviceId }) => {
        const targetUser = activeUsers.get(userId);
        const callerUser = activeUsers.get(callerUserId);
    
        if(!callerUser || !callerUser.activeCalls.has(userId)) {
            return io.to(socket.id).emit('call-error', { message: 'Caller not found.' });
        }

        try {
            //  Search call in the database
            const call = await Call.findOne({ where: { id: callId, ownerId: userId }});

            if(!call || call.status !== 'ongoing') {
                return io.to(socket.id).emit('call-error', { message: 'Call not found or already ended.' });
            }

            //  If user already is busy, end existing active call
            if(targetUser.status === 'busy') {
                const [otherUserId, activeCall] = targetUser.activeCalls.entries().find(([_, call]) => call.status === 'ongoing');
                await endCall(activeCall.callId, otherUserId, activeUsers, userId, io);
            }

            //  Read target user fcmTokens from database
            const fcmTokens = (await Token.findAll({
                where: {
                    ownerId: userId,
                    deviceId: { [Sequelize.Op.ne]: deviceId }
                },
                attributes: ['fcmToken'],
                raw: true
            })).map(t => t.fcmToken);

            //  Update caller user status and corresponding active call
            const callerUserCall = callerUser.activeCalls.get(userId);
            const callerUserSocketId = callerUserCall.socketId;

            clearTimeout(callerUserCall.timeout);
            delete callerUserCall.timeout;

            callerUser.activeCalls.set(userId, { ...callerUserCall, status: 'ongoing' });
            activeUsers.set(callerUserId, { ...callerUser, status: 'busy' });

            //  Update target user status and add call to active calls
            targetUser.activeCalls.set(callerUserId, {
                callId,
                socketId: socket.id,
                status: 'ongoing'
            });

            activeUsers.set(userId, { ...targetUser, status: 'busy' });

            //  Some Logging
            activeUsers.entries().forEach(([key, userData]) => {
                console.log(key);
                console.log(userData);
            });

            //  Notify both caller and target users
            if(fcmTokens > 0) {
                await sendPushNotification(fcmTokens, {
                    callId: callId.toString(),
                    type: "incoming-call-handled" 
                });
            }

            //  TODO: uncomment when implement MediaSoup
            //const transportCaller = await mediasoup.createTransport(callerSocketId);
            //const transportReceiver = await mediasoup.createTransport(socket.id);

            //io.to(callerUser.socketId).emit('transport-created', transportCaller);
            //io.to(socket.id).emit('transport-created', transportReceiver);

            io.to(socket.id).emit('call-answered');
            io.to(callerUserSocketId).emit('call-answered');
        } catch (error) {
            console.log(error);
            io.to(socket.id).emit('call-error', { message: error.message });
        }
    };

    const onRejectCall = async ({ callId, callerUserId, deviceId }) => {
        const callerUser = activeUsers.get(callerUserId);
        
        if(!callerUser || !callerUser.activeCalls.has(userId)) {
            return io.to(socket.id).emit('call-error', { message: 'Caller not found.' });
        }

        //  Start a new transaction
        const transaction = await sequelize.transaction();

        try {
            //  Search call in the database
            const call = await Call.findOne({ where: { id: callId, ownerId: userId }, transaction });

            if(!call || call.status !== 'ongoing') {
                //  Rollback transaction in case of error
                await transaction.rollback();

                return io.to(socket.id).emit('call-error', { message: 'Call not found or already ended.' });
            }

            //  Update caller call status in the database
            const callerUserCall = callerUser.activeCalls.get(userId);
            const callerUserSocketId = callerUserCall.socketId;
            await Call.update({ status: 'rejected' }, { where: { id: callerUserCall.callId }, transaction });
            
            //  Update target call status in the database
            await call.update({ status: 'missed' }, { transaction });

            //  Read contact of target user from database
            const targetUserContact = await Contact.findOne({
                where: { ownerId: userId, userId: callerUserId },
                attributes: ['id', 'firstName', 'lastName', 'phone'],
                include: {
                    model: User,
                    attributes: ['id', 'imageProfile'],
                    as: 'user'
                },
                transaction
            });

            //  Read caller user data from database
            const callerUserData = await User.findOne({
                where: { id: callerUserId },
                attributes: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
                transaction
            });

            //  Read target user fcmTokens from database
            const fcmTokensRaw = (await Token.findAll({
                where: { ownerId: userId },
                attributes: ['deviceId', 'fcmToken'],
                transaction,
                raw: true
            }));
            
            const fcmTokens = fcmTokensRaw.map(t => t.fcmToken);

            const filteredFcmTokens = fcmTokensRaw
                .filter(t => t.deviceId !== deviceId)
                .map(t => t.fcmToken);

            //  Remove active call from callerUser and update its status
            clearTimeout(callerUserCall.timeout);
            callerUser.activeCalls.delete(userId);
            const newStatus = callerUser.activeCalls.size === 0 ? 'available' : callerUser.status;
            activeUsers.set(callerUserId, { ...callerUser, status: newStatus });

            //  Some Logging
            activeUsers.entries().forEach(([key, userData]) => {
                console.log(key);
                console.log(userData);
            });

            //  Notify both caller and target users
            if(filteredFcmTokens.length > 0) {
                await sendPushNotification(filteredFcmTokens, {
                    callId: callId.toString(),
                    type: "incoming-call-handled"
                });
            }
            
            setTimeout(() => {
                sendPushNotification(fcmTokens, {
                    notifee: JSON.stringify({
                      title: targetUserContact ? `${targetUserContact.firstName} ${targetUserContact.lastName || ''}`.trim() : 
                        callerUserData.phone,
                      body: 'Missed Call',
                      imageProfile: targetUserContact ? targetUserContact.user.imageProfile : callerUserData.imageProfile,
                      data: {
                        callId,
                        type: 'missed-call'
                      }
                    })
                });
            }, 2000);
            
            //  Commit transaction
            await transaction.commit();

            io.to(callerUserSocketId).emit('call-ended', { reason: 'rejected' });
        } catch (error) {
            console.log(error);
            //  Rollback transaction in case of error
            await transaction.rollback();

            io.to(socket.id).emit('call-error', { message: error.message });
        }
    };

    return { onCallUser, onEndCall, onAnswerCall, onRejectCall };
};