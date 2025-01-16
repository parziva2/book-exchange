/**
 * Utility for retrying MongoDB operations
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a MongoDB operation with exponential backoff
 */
const withRetry = async (operation, maxRetries = MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on connection or network errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (error) => {
  // Network errors
  if (error.name === 'MongoNetworkError') return true;
  
  // Connection errors
  if (error.name === 'MongoError') {
    const retryableCodes = [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ECONNRESET',
      'EPIPE'
    ];
    return retryableCodes.includes(error.code);
  }
  
  return false;
};

module.exports = {
  withRetry
}; 