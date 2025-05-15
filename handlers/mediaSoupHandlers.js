'use strict';

const { consumeAndProduce } = require('../utils/accessibility');

module.exports = (io, activeUsers, socket, router, transports, producers, pendingProducers, consumers) => {
    const userId = socket.user.id;

    const onGetRouterRtpCapabilities = (callback) => {
        if(router) {
            callback(router.rtpCapabilities);
        } else {
            callback(null);
        }
    };

    const onConnectTransport = async ({ transportId, dtlsParameters }, callback) => {
        try {
            const transport = transports.get(transportId);
            await transport.connect({ dtlsParameters });
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    };

    const onCreateProducer = async ({ transportId, kind, rtpParameters, appData }, callback) => {
        try {
            const user = activeUsers.get(userId);
            const callEntry = user.activeCalls.entries().find(([_, call]) => call.status === 'ongoing');

            //  Check if call exists
            if(!callEntry) {
                callback({ sucess: false, error: 'Call not found or already ended.' });
                return;
            }

            const [otherUserId, userCall]= callEntry;
            const otherUser = activeUsers.get(otherUserId);
            const otherUserSocketId = otherUser.activeCalls.get(userId).socketId;
            const transport = transports.get(transportId);
            const producer = await transport.produce({ kind, rtpParameters, appData });

            //  Setup handler to intercept change score event
            producer.on('score', (scoreData) => {
                io.to(socket.id).emit('score-changed', { score: scoreData[0].score });
            });

            producers.set(producer.id, producer);

            //  Add new producer to user
            user.producerIds.push(producer.id);

            if (userCall.useAccessibility && user.useAccessibility && kind === 'video') {
                const videoPlainTransport = transports.get(user.videoAccessibilityTransportId);
                const audioPlainTransport = transports.get(user.audioAccessibilityTransportId);
                const { accessibilityConsumer, accessibilityProducer } = await consumeAndProduce(router, videoPlainTransport, audioPlainTransport, producer);

                consumers.set(accessibilityConsumer.id, accessibilityConsumer);
                producers.set(accessibilityProducer.id, accessibilityProducer);

                user.consumerIds.push(accessibilityConsumer.id);
                user.producerIds.push(accessibilityProducer.id);

                const accessibilityProducerInfo = { producerId: accessibilityProducer.id, accessibility: true };

                if (otherUser.isReadyToConsume) {
                    io.to(otherUserSocketId).emit('new-producer', accessibilityProducerInfo);
                } else {
                    if (!pendingProducers.has(otherUserId)) {
                        pendingProducers.set(otherUserId, [accessibilityProducerInfo]);
                    } else {
                        const otherUserPendingProducers = pendingProducers.get(otherUserId);
                        otherUserPendingProducers.push(accessibilityProducerInfo);
                    }
                }
            }
            
            const producerInfo = { producerId: producer.id, accessibility: false };

            if(otherUser.isReadyToConsume) {
                io.to(otherUserSocketId).emit('new-producer', producerInfo);
            } else {
                if(!pendingProducers.has(otherUserId)) {
                    pendingProducers.set(otherUserId, [producerInfo]);
                } else {
                    const otherUserPendingProducers = pendingProducers.get(otherUserId);
                    otherUserPendingProducers.push(producerInfo);
                }
            }

            callback({ success: true, id: producer.id });
        } catch (error) {
            callback({ sucess: false, error: error.message });
        }
    };
    
    const onPauseProducer = async ({ producerId }, callback) => {
        try {
            const producer = producers.get(producerId);
            await producer.pause();
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    };

    const onResumeProducer = async ({ producerId }, callback) => {
        try {
            const producer = producers.get(producerId);
            await producer.resume();
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    }; 
      
    const onCreateConsumer = async ({ transportId, producerId, rtpCapabilities }, callback) => {
        try {
            if(!router.canConsume({ producerId, rtpCapabilities })) {
                callback({ sucess: false, error: 'Cannot consume this producer.' });
                return;
            }

            const user = activeUsers.get(userId);
            const transport = transports.get(transportId);
            const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
            
            //  Setup consumer to intercept when the associated producer is paused or resumed
            consumer.on('producerpause', () => {
                io.to(socket.id).emit('producer-paused', { kind: consumer.kind });
            });

            consumer.on('producerresume', () => {
                io.to(socket.id).emit('producer-resumed', { kind: consumer.kind });
            });

            //  Setup handler to intercept change score event
            consumer.on('score', (scoreData) => {
                io.to(socket.id).emit('score-changed', { score: scoreData.score });
            });

            consumers.set(consumer.id, consumer);

            //  Add new consumer to user
            user.consumerIds.push(consumer.id);

            callback({
                success: true, 
                params: {
                    id: consumer.id,
                    producerId: consumer.producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters
                }
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    };
      
    const onResumeConsumer = async ({ consumerId }, callback) => {
        try {
            const consumer = consumers.get(consumerId);
            await consumer.resume();
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    };

    const onReadyToConsume = () => {
        //  Check if user exists in activeUsers
        if(!activeUsers.has(userId)) { return; }

        const user = activeUsers.get(userId);

        //  Update user's ready status
        user.isReadyToConsume = true;

        if(pendingProducers.has(userId)) {
            pendingProducers.get(userId).forEach(({producerId, accessibility }) => {
                io.to(socket.id).emit('new-producer', { producerId, accessibility });
            });

            pendingProducers.delete(userId);
        }
    };

    return { 
        onGetRouterRtpCapabilities, 
        onConnectTransport, 
        onCreateProducer, 
        onPauseProducer, 
        onResumeProducer, 
        onCreateConsumer, 
        onResumeConsumer,
        onReadyToConsume
    };
}