// frontend/src/utils/helpers.js

export const handleApiError = (err, setError, defaultMessage) => {
    console.error(err);
    const message =
      err.response?.data?.detail || defaultMessage || "An error occurred.";
    setError(message);
  };
  
  export const autoClearError = (error, setError, timeout = 5000) => {
    if (error) {
      const timer = setTimeout(() => setError(null), timeout);
      return () => clearTimeout(timer);
    }
  };
  