import { ethers } from 'ethers';
import { USDT_CONTRACT_ADDRESS, BOT_PAYMENT_CONTRACT_ADDRESS } from '../contracts/addresses';
import { USDT_ABI } from '../contracts/abis/usdt';

export const checkUSDTBalance = async (address: string, provider: ethers.providers.Web3Provider): Promise<string> => {
  try {
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    const balance = await usdtContract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 6); // USDT 有 6 位小数
  } catch (error) {
    console.error('检查 USDT 余额失败:', error);
    throw new Error('检查 USDT 余额失败');
  }
};

export const checkUSDTAllowance = async (
  address: string,
  provider: ethers.providers.Web3Provider
): Promise<string> => {
  try {
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    const allowance = await usdtContract.allowance(address, BOT_PAYMENT_CONTRACT_ADDRESS);
    return ethers.utils.formatUnits(allowance, 6);
  } catch (error) {
    console.error('检查 USDT 授权失败:', error);
    throw new Error('检查 USDT 授权失败');
  }
};

export const approveUSDT = async (
  amount: string,
  provider: ethers.providers.Web3Provider
): Promise<ethers.providers.TransactionResponse> => {
  try {
    const signer = provider.getSigner();
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);
    const amountInWei = ethers.utils.parseUnits(amount, 6);
    const tx = await usdtContract.approve(BOT_PAYMENT_CONTRACT_ADDRESS, amountInWei);
    return tx;
  } catch (error) {
    console.error('USDT 授权失败:', error);
    throw new Error('USDT 授权失败');
  }
}; 