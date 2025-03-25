'use strict';

//  TODO: remove logging once tested
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
            console.log(error);
            callback({ success: false, error: error.message });
        }
    };

    const onCreateProducer = async ({ transportId, kind, rtpParameters, appData }, callback) => {
        console.log('Sto creando il producer');
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
            //console.log(transport.id);
            const producer = await transport.produce({ kind, rtpParameters, appData });
            //console.log(producer.id);
            producers.set(producer.id, producer);

            //  Add new producer to user
            user.producerIds.push(producer.id);
            activeUsers.set(userId, user);

            //  TODO: remove this
            //console.log(producers);
            activeUsers.values().forEach(user => {
                console.log(user);
            });

            if(otherUser.isReadyToConsume) {
                console.log('Sending producerId to: ', otherUserSocketId);
                io.to(otherUserSocketId).emit('new-producer', { producerId: producer.id });
            } else {
                if(!pendingProducers.has(otherUserId)) {
                    pendingProducers.set(otherUserId, [producer.id]);
                } else {
                    const otherUserPendingProducers = pendingProducers.get(otherUserId);
                    otherUserPendingProducers.push(producer.id);
                    pendingProducers.set(otherUserId, otherUserPendingProducers);
                }

                //  TODO: remove this
                console.log(pendingProducers);
            }

            callback({ success: true, id: producer.id });
        } catch (error) {
            console.log(error);
            callback({ sucess: false, error: error.message });
        }
    };
    
    const onPauseProducer = async ({ producerId }, callback) => {
        try {
            const producer = producers.get(producerId);
            await producer.pause();
            callback({ success: true });
        } catch (error) {
            console.log(error);
            callback({ success: false, error: error.message });
        }
    };

    const onResumeProducer = async ({ producerId }, callback) => {
        try {
            const producer = producers.get(producerId);
            await producer.resume();
            callback({ success: true });
        } catch (error) {
            console.log(error);
            callback({ success: false, error: error.message });
        }
    }; 
      
    const onCreateConsumer = async ({ transportId, producerId, rtpCapabilities }, callback) => {
        console.log('Sto creando il consumer');
        try {
            if(!router.canConsume({ producerId, rtpCapabilities })) {
                callback({ sucess: false, error: 'Cannot consume this producer.' });
                return;
            }

            const user = activeUsers.get(userId);
            const transport = transports.get(transportId);
            //console.log(transport.id);

            //  TODO: we can add the event handler that intercept when associated producer is paused or resume
            //  to change client-side view
            const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
            //console.log(consumer.id);
            consumers.set(consumer.id, consumer);

            //  Add new consumer to user
            user.consumerIds.push(consumer.id);
            activeUsers.set(userId, user);

            //  TODO: remove this
            //console.log(consumers);
            console.log(activeUsers);

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
            console.log(error);
            callback({ success: false, error: error.message });
        }
    };
      
    const onResumeConsumer = async ({ consumerId }, callback) => {
        try {
            const consumer = consumers.get(consumerId);
            await consumer.resume();
            callback({ success: true });
        } catch (error) {
            console.log(error);
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

            //  TODO: remove this
            console.log(pendingProducers);
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