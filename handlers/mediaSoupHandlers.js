'use strict';

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

            const [otherUserId, _]= callEntry;
            const otherUser = activeUsers.get(otherUserId);
            const otherUserSocketId = otherUser.activeCalls.get(userId).socketId;
            const transport = transports.get(transportId);
            const producer = await transport.produce({ kind, rtpParameters, appData });
            producers.set(producer.id, producer);

            //  Add new producer to user
            user.producerIds.push(producer.id);
            activeUsers.set(userId, user);

            if(otherUser.isReadyToConsume) {
                io.to(otherUserSocketId).emit('new-producer', { producerId: producer.id });
            } else {
                if(!pendingProducers.has(otherUserId)) {
                    pendingProducers.set(otherUserId, [producer.id]);
                } else {
                    const otherUserPendingProducers = pendingProducers.get(otherUserId);
                    otherUserPendingProducers.push(producer.id);
                    pendingProducers.set(otherUserId, otherUserPendingProducers);
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

            consumers.set(consumer.id, consumer);

            //  Add new consumer to user
            user.consumerIds.push(consumer.id);
            activeUsers.set(userId, user);

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
        activeUsers.set(userId, user);

        if(pendingProducers.has(userId)) {
            pendingProducers.get(userId).forEach(producerId => {
                io.to(socket.id).emit('new-producer', { producerId });
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