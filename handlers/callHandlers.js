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
const { createTransport } = require('../config/mediaSoup');

dayjs.extend(utc);

module.exports = (io, activeUsers, socket, router, transports, producers, consumers) => {
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

            if (fcmTokens.length === 0) {
                //  Rollback transaction in case of error
                await transaction.rollback();

                return io.to(socket.id).emit('call-error', { message: 'User unreachable.' });  
            }
            
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

            //  Create both send and receive transport for caller User
            const { transport: sendTransport, params: sendTransportParams } = await createTransport(router);
            const { transport: recvTransport, params: recvTransportParams } = await createTransport(router);

            //  Add new transports to the transports map
            transports.set(sendTransport.id, sendTransport);
            transports.set(recvTransport.id, recvTransport);

            //  Add new active call and new transports to callerUser and update its status
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
                    ), 30000
                )
            });

            callerUser.transportIds.push(sendTransport.id, recvTransport.id);
            callerUser.status = 'ringing';

            //  Notify targetUser of the incoming-call
            await sendPushNotification(fcmTokens, {
                type: "incoming-call",
                callId: targetUserCall.id.toString(),
                contact: targetUserContact ? JSON.stringify(targetUserContact) : undefined,
                user: !targetUserContact ? JSON.stringify(callerUserData) : undefined
            });
            
            //  Commit transaction
            await transaction.commit();

            io.to(socket.id).emit('call-started', { callId: callerUserCall.id, sendTransportParams, recvTransportParams });
        } catch (error) {
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

            //  Close and delete all transports associated to callerUser
            callerUser.transportIds.forEach(transportId => {
                const transport = transports.get(transportId);
                transport.close();
                transports.delete(transportId);
            });

            callerUser.transportIds = [];

            //  Remove active call from callerUser and update its status
            callerUser.activeCalls.delete(targetUserId);
            const newStatus = callerUser.activeCalls.size === 0 ? 'available' : callerUser.status;
            callerUser.status = newStatus;

            //  Notify both caller and target users
            await sendPushNotification(fcmTokens, {
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
            }, 2000);
            
            //  Commit transaction
            await transaction.commit();

            io.to(socket.id).emit('call-ended', { reason: 'unanswered' });
        } catch (error) {
            //  Rollback transaction in case of error
            await transaction.rollback();
        }
    };

    const onEndCall = async ({ callId, otherUserId }) => {
        const now = dayjs();
        const user = activeUsers.get(userId);
        const otherUser = activeUsers.get(otherUserId);

        if(!user.activeCalls.has(otherUserId)) {
            return io.to(socket.id).emit('call-error', { message: 'Call not found.' });
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
                return io.to(socket.id).emit('call-error', { message: 'Call not found or already ended.' });
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

                //  Close and delete all transports associated to user
                user.transportIds.forEach(transportId => {
                    const transport = transports.get(transportId);
                    transport.close();
                    transports.delete(transportId);
                });

                user.transportIds = [];

                //  Update user status and corresponding active calls
                clearTimeout(userCall.timeout);
                user.activeCalls.delete(otherUserId);
                user.status = 'available';

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
                    return io.to(socket.id).emit('call-error', { message: 'User not found.' });
                }

                const duration = now.diff(dayjs(userCallData.date), 'second');

                //  Update user call in the database
                await userCallData.update({ status: 'completed', duration }, { transaction });

                //  Update other user call in the database
                await otherUserCallData.update({ status: 'completed', duration }, { transaction });

                //  Close and delete all transports associated to user
                user.transportIds.forEach(transportId => {
                    const transport = transports.get(transportId);
                    transport.close();
                    transports.delete(transportId);
                });

                //  Delete all producers and consumers associated to user
                user.producerIds.forEach(producerId => { producers.delete(producerId); });
                user.consumerIds.forEach(consumerId => { consumers.delete(consumerId); });

                user.transportIds = [];
                user.producerIds = [];
                user.consumerIds = [];

                //  Close and delete all transports associated to otherUser
                otherUser.transportIds.forEach(transportId => {
                    const transport = transports.get(transportId);
                    transport.close();
                    transports.delete(transportId);
                });

                //  Delete all producers and consumers associated to otherUser
                otherUser.producerIds.forEach(producerId => { producers.delete(producerId); });
                otherUser.consumerIds.forEach(consumerId => { consumers.delete(consumerId); });

                otherUser.transportIds = [];
                otherUser.producerIds = [];
                otherUser.consumerIds = [];

                //  Update both users status and corresponding active calls
                user.activeCalls.delete(otherUserId);
                activeUsers.set(userId, { ...user, status: 'available', isReadyToConsume: false });

                const otherUserCall = otherUser.activeCalls.get(userId);
                otherUserSocketId = otherUserCall.socketId
                otherUser.activeCalls.delete(userId);
                activeUsers.set(otherUserId, { ...otherUser, status: 'available', isReadyToConsume: false });
            }

            //  Commit transaction
            await transaction.commit();

            if(!isCallRinging) { 
                io.to(otherUserSocketId).emit('call-ended', { reason: 'completed' }); 
            }

            io.to(userSocketId).emit('call-ended', { reason: 'completed' });
        } catch (error) {
            //  Rollback transaction in case of error
            await transaction.rollback();

            return io.to(socket.id).emit('call-error', { message: error.message });
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
                return io.to(socket.id).emit('call-error', { message: 'An active call already exists.' });
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

            //  Create both send and receive transport for target user
            const { transport: sendTransport, params: sendTransportParams } = await createTransport(router);
            const { transport: recvTransport, params: recvTransportParams } = await createTransport(router);

            //  Add new transports to the transports map
            transports.set(sendTransport.id, sendTransport);
            transports.set(recvTransport.id, recvTransport);

            //  Update caller user status and corresponding active call
            const callerUserCall = callerUser.activeCalls.get(userId);
            const callerUserSocketId = callerUserCall.socketId;
            clearTimeout(callerUserCall.timeout);
            delete callerUserCall.timeout;
            callerUserCall.status = 'ongoing';
            callerUser.status = 'busy';

            //  Update target user status and add call to active calls
            targetUser.activeCalls.set(callerUserId, {
                callId,
                socketId: socket.id,
                status: 'ongoing'
            });

            targetUser.transportIds.push(sendTransport.id, recvTransport.id);
            targetUser.status = 'busy';

            //  Notify both caller and target users
            if(fcmTokens.length > 0) {
                await sendPushNotification(fcmTokens, {
                    callId: callId.toString(),
                    type: "incoming-call-handled" 
                });
            }

            io.to(socket.id).emit('call-joined', { callId, sendTransportParams, recvTransportParams });
            io.to(callerUserSocketId).emit('call-answered');
        } catch (error) {
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

            //  Close and delete all transports associated to callerUser
            callerUser.transportIds.forEach(transportId => {
                const transport = transports.get(transportId);
                transport.close();
                transports.delete(transportId);
            });

            callerUser.transportIds = [];

            //  Remove active call from callerUser and update its status
            clearTimeout(callerUserCall.timeout);
            callerUser.activeCalls.delete(userId);
            const newStatus = callerUser.activeCalls.size === 0 ? 'available' : callerUser.status;
            callerUser.status = newStatus;

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
            //  Rollback transaction in case of error
            await transaction.rollback();

            io.to(socket.id).emit('call-error', { message: error.message });
        }
    };

    return { onCallUser, onEndCall, onAnswerCall, onRejectCall };
};