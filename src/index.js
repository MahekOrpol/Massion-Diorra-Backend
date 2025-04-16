const mongoose = require('mongoose');
const http = require('http'); // 👈 Add this
const socketIo = require('socket.io'); // 👈 Add this
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;
let io;

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('Connected to MongoDB');
    mongoose.set('debug', true);

    // ✅ Create HTTP server and bind it to Express app
    server = http.createServer(app);

    // ✅ Initialize Socket.IO
    io = socketIo(server, {
        cors: {
            origin: '*', // Replace with frontend origin if needed
            methods: ['GET', 'POST'],
        },
    });

    // ✅ Handle socket connections
    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });

        // Add custom socket events here
        socket.on('ping-server', (data) => {
            logger.info('Received ping from client:', data);
            socket.emit('pong-server', { msg: 'Pong from server!' });
        });
    });

    server.listen(config.port, () => {
        logger.info(`Listening on port ${config.port}`);
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
