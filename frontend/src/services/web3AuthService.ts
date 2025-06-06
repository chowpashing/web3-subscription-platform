import { ethers } from 'ethers';
import axios from 'axios';
import { USDT_CONTRACT_ADDRESS, BOT_PAYMENT_CONTRACT_ADDRESS } from '../contracts/addresses';
import { SiweMessage } from 'siwe';

// API基础URL
const API_BASE_URL = "http://localhost:8000/api";

// USDT合约ABI
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)"
];

// 请求用户连接Web3钱包
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected, please install MetaMask or other Ethereum wallet');
  }
  
  try {
    // 请求用户授权连接钱包
    const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  } catch (error) {
    console.error('连接钱包失败:', error);
    throw new Error('连接钱包失败');
  }
};

// 检查USDT余额
export const checkUSDTBalance = async (address: string) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 6); // USDT有6位小数
  } catch (error) {
    console.error('获取USDT余额失败:', error);
    throw new Error('获取USDT余额失败');
  }
};

// 检查USDT授权额度
export const checkUSDTAllowance = async (address: string) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    const allowance = await contract.allowance(address, BOT_PAYMENT_CONTRACT_ADDRESS);
    return ethers.utils.formatUnits(allowance, 6); // USDT有6位小数
  } catch (error) {
    console.error('获取USDT授权额度失败:', error);
    throw new Error('获取USDT授权额度失败');
  }
};

// 授权USDT
export const approveUSDT = async (amount: string) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);
    const amountInWei = ethers.utils.parseUnits(amount, 6); // USDT有6位小数
    const tx = await contract.approve(BOT_PAYMENT_CONTRACT_ADDRESS, amountInWei);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('USDT授权失败:', error);
    throw new Error('USDT授权失败');
  }
};

// 使用钱包地址进行登录
export const loginWithWallet = async () => {
  try {
    const { address, signer } = await connectWallet();
    
    // 创建要签名的消息
    const message = `Sign this message to login to Bot Management Platform. Wallet: ${address}`;
    console.log('准备签名的消息:', message);
    
    // 使用钱包签名
    const signature = await signer.signMessage(message);
    console.log('签名结果:', signature);
    
    // 发送登录请求
    const requestData = {
      message,
      signature,
      wallet_address: address
    };
    
    console.log('发送登录请求数据:', requestData);
    
    const response = await axios.post(`${API_BASE_URL}/user/web3-login/`, requestData);
    console.log('登录响应:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('钱包登录失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('API错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.status === 401) {
        throw new Error('签名验证失败，请确保使用正确的钱包地址');
      } else if (error.response?.status === 400) {
        throw new Error(`请求参数错误: ${error.response?.data?.error || error.message}`);
      } else {
        throw new Error(`钱包登录失败: ${error.response?.data?.message || error.message}`);
      }
    }
    throw new Error('钱包登录失败');
  }
};

// 绑定邮箱和角色
export const bindEmailAndRole = async (walletAddress: string, email: string, role: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/bind-email/`, {
      wallet_address: walletAddress,
      email,
      role
    });
    return response.data;
  } catch (error) {
    console.error('绑定邮箱和角色失败:', error);
    throw new Error('绑定邮箱和角色失败');
  }
};