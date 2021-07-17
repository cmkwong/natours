class AppError extends Error { // ES6 class
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // User errpr

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
