import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    // Log the error using our structured logger
    logger.error({
        message: err.message || "An unexpected system error occurred",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
    
    return res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production" && statusCode === 500
            ? "Internal Server Error"
            : err.message || "An unexpected system error occurred"
    });
};

export default errorHandler;
