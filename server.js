'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const sequelize = require('./config/database');
require('./models/associations'); 
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const usersRoutes = require('./routes/usersRoutes');
const contactsRoutes = require('./routes/contacstRoutes');
const callsRoutes = require('./routes/callsRoutes');
const tokensRoutes = require('./routes/tokensRoutes');
const downloadsRoutes = require('./routes/downloadsRoutes');
const redisClient = require('./config/redisClient');
const { initMediaSoup } = require('./config/mediaSoup');
const { initWebSocket } = require('./config/webSocket');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

// Init express
const app = express();
const server = http.createServer(app);
const port = process.env.PORT

//  Set-up middlewares
app.use(morgan('dev'));
app.use(express.json());

//  Set-up routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', usersRoutes);
app.use('/api', contactsRoutes);
app.use('/api', callsRoutes);
app.use('/api', tokensRoutes);
app.use('/api', downloadsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

(async () => {
  try {
    //  Initialize MediaSoup
    const { router } = await initMediaSoup();

    //  Initialize WebSocket
    initWebSocket(server, router);

    //  Connect to Redis
    await redisClient.connect();

    // Synchronize database
    await sequelize.sync();

    // Activate server
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error initializing server:', error);
    process.exit(1);
  }
})();