import axiosInstance from './axiosConfig';

export const getHelpRequests = async () => {
  try {
    const response = await axiosInstance.get('/public/help-requests');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch help requests';
    throw new Error(message);
  }
};
