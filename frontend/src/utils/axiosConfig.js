// frontend/src/utils/axiosConfig.js

/**
 * Axios Configuration
 * 
 * This module sets up the base URL and default configurations for Axios.
 */

import axios from "axios";

// Set the base URL for Axios
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors for request/response if needed
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    return Promise.reject(error);
  }
);

export default axiosInstance;
