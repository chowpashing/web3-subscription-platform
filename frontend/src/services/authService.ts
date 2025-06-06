import axios from "axios";

// API基础URL
const API_BASE_URL = "http://localhost:8000/api";

export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/user/login/`, {
    email,
    password
  });
  return response.data;
};

export const registerUser = async (email: string, password: string, role: string, password2: string) => {
  const response = await axios.post(`${API_BASE_URL}/user/register/`, {
    email,
    password,
    role,
    password2
  });
  return response.data;
};

export const deleteAccount = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/user/delete/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

