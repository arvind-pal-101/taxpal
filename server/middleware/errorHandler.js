const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Server error';

    logger.error(`${req.method} ${req.originalUrl} - ${status} - ${message}`);

    if (process.env.NODE_ENV === 'development') {
        return res.status(status).json({ message, stack: err.stack });
    }

    res.status(status).json({ message });
};

module.exports = errorHandler;
