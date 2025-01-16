/**
 * Utility function to retry MongoDB operations with exponential backoff
 * @param {Function} operation - The MongoDB operation to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 5000)
 * @returns {Promise} - Result of the operation
 */
const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if the error is not related to connection
      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      console.log(`Retry attempt ${attempt} of ${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff with jitter
      delay = Math.min(delay * 2 * (0.9 + Math.random() * 0.2), maxDelay);
    }
  }

  throw new Error(`Operation failed after ${maxRetries} retries. Last error: ${lastError.message}`);
};

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
const isRetryableError = (error) => {
  const retryableErrors = [
    'MongoNetworkError',
    'MongoTimeoutError',
    'MongoServerSelectionError',
    'MongoWriteConcernError'
  ];

  return (
    retryableErrors.includes(error.name) ||
    error.message.includes('connect ECONNREFUSED') ||
    error.message.includes('connection timed out')
  );
};

module.exports = {
  withRetry,
  isRetryableError
}; 