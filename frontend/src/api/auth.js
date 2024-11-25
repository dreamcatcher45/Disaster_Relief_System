import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'Network error occurred';
  throw new Error(message);
};

export const login = async (loginData) => {
  const { role } = loginData;
  try {
    const requestData = {
      ...(role === 'user' 
        ? { phone_number: loginData.phoneNumber }
        : { email: loginData.email }
      ),
      password: loginData.password
    };

    const response = await axios.post(
      `${API_URL}/${role}/login`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/user/register`, {
      name: userData.name,
      email: userData.email,
      phone_number: userData.phoneNumber,
      address: userData.address,
      password: userData.password
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
