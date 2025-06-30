import axios, { AxiosError } from 'axios';
import { Bot, PublishResponse } from '../types/bot';
import { ethers } from 'ethers';


// API基础URL
const API_BASE_URL = '/api';  // 改为相对路径，让开发服务器代理处理

// 定义API响应类型
interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

// 创建机器人
export const createBot = async (formData: FormData) => {
  try {
    const headers = getAuthHeader();
    console.log('Creating bot with headers:', headers);
    
    const response = await axios.post(`${API_BASE_URL}/bots/`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Bot creation failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
    throw error;
  }
};

// 获取机器人列表
export const getBots = async () => {
  const response = await axios.get(`${API_BASE_URL}/bots/`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// 获取单个机器人详情
export const getBot = async (id: number) => {
  try {
    console.log('Fetching bot with ID:', id);
    const headers = getAuthHeader();
    console.log('Request headers:', headers);
    
    const response = await axios.get<Bot>(`${API_BASE_URL}/bots/${id}/get_published_bot/`, {
      headers: getAuthHeader()
    });
    
    console.log('Bot response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching bot:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
    throw error;
  }
};

// 更新机器人信息
export const updateBot = async (id: number, formData: FormData) => {
  const response = await axios.patch(`${API_BASE_URL}/bots/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...getAuthHeader()
    }
  });
  return response.data;
};

// 删除机器人
export const deleteBot = async (id: number) => {
  const response = await axios.delete(`${API_BASE_URL}/bots/${id}/`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// 上传到IPFS
export const uploadToIPFS = async (botId: number) => {
  const response = await axios.post(`${API_BASE_URL}/bots/${botId}/upload_to_ipfs/`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// 上架机器人（包含IPFS上传和智能合约注册）
export const publishBot = async (botId: number) => {
  const response = await axios.post(`${API_BASE_URL}/bots/${botId}/publish/`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const confirmPublish = async (botId: number, transactionHash: string) => {
  const response = await axios.post(`${API_BASE_URL}/bots/${botId}/confirm_publish/`, {
    transactionHash,
  }, {
    headers: getAuthHeader()
  });
  return response.data;
};

// 获取已上链的机器人列表
export const getPublishedBots = async (): Promise<Bot[]> => {
  try {
    const headers = getAuthHeader();
    console.log('Request URL:', `${API_BASE_URL}/bots/published/`);
    console.log('Request Headers:', headers);
    
    const response = await axios.get(`${API_BASE_URL}/bots/published/`, {
      headers: {
        ...headers,
        'Accept': 'application/json',
      }
    });

    console.log('Response:', response);
    
    if (!response.data) {
      console.error('No data in response');
      return [];
    }

    // 确保返回的是数组
    const bots = Array.isArray(response.data) ? response.data : 
                 Array.isArray(response.data.results) ? response.data.results : [];
    
    console.log('Processed bots:', bots);
    return bots;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params
        }
      });
    } else {
      console.error('Non-Axios Error:', error);
    }
    throw error;
  }
};



const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};