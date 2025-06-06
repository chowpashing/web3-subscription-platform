import { ethers } from 'ethers';

export const formatBalance = (balance: string | number): string => {
  if (!balance) return '0';
  const formatted = ethers.utils.formatUnits(balance, 6); // USDT 有 6 位小数
  return parseFloat(formatted).toFixed(2);
}; 