import axiosInstance from './axiosConfig';

const API_URL = import.meta.env.VITE_API_URL;

const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'Network error occurred';
  throw new Error(message);
};

export const login = async (loginData) => {
  try {
    const { role, ...data } = loginData;
    let endpoint;
    
    // Set correct endpoints based on role
    switch(role) {
      case 'user':
        endpoint = '/user/login';
        break;
      case 'admin':
        endpoint = '/admin/login';
        break;
      case 'moderator':
        endpoint = '/moderator/login';
        break;
      default:
        throw new Error('Invalid role');
    }
    
    const requestData = {
      ...(role === 'user' 
        ? { phone_number: data.phoneNumber }
        : { email: data.email }
      ),
      password: data.password
    };

    const response = await axiosInstance.post(endpoint, requestData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const register = async (userData) => {
  try {
    const requestData = {
      name: userData.name,
      email: userData.email,
      phone_number: userData.phoneNumber,
      address: userData.address,
      password: userData.password
    };

    const response = await axiosInstance.post('/user/register', requestData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/user/profile');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Add token to all subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};
