const { createLogger, format, transports } = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDir, 'server.log') })
    ],
});

module.exports = logger;
