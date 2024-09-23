type RetryOptions = {
  retries: number;
  delay: number;
};

export const useRetry = (
  asyncFunction: () => Promise<any>,
  options: RetryOptions,
) => {
  const retryOperation = async () => {
    let currentRetry = 0;
    while (currentRetry <= options.retries) {
      try {
        await asyncFunction();
        break;
      } catch (error) {
        if (currentRetry === options.retries) {
          console.debug('Retry limit exceeded', currentRetry);
          throw error;
        }
        currentRetry++;
        console.debug(error, 'retry', currentRetry, 'after', options.delay);
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }
    }
  };

  return retryOperation;
};
