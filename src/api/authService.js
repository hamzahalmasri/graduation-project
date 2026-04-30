import axios from 'axios';

const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api';
//const BASE_URL = 'https://eduguide-t7xp.onrender.com/api';


//sign up function
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/users`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error('Network error or server is down');
  }
};

//Login function 
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/users/login`, credentials);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) { //Unauthorized or Not Found

      throw new Error(error.response.data.message || 'Login failed. Please check your credentials.');
    }
    throw new Error('Network error or server is down');
  }
};