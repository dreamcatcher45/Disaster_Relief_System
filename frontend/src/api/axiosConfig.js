import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log the request
    console.group('API Request');
    console.log('URL:', config.baseURL + config.url);
    console.log('Method:', config.method.toUpperCase());
    console.log('Headers:', config.headers);
    if (config.data) {
      console.log('Request Data:', config.data);
    }
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log the response
    console.group('API Response');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Response Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    // Log the error response
    console.group('API Error');
    console.log('URL:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
    console.groupEnd();
    return Promise.reject(error);
  }
);

export default axiosInstance;
