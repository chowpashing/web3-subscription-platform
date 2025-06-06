import { Subscription } from '../types/subscription';
import { ethers } from 'ethers';
import { BOT_SUBSCRIPTION_CONTRACT_ADDRESS } from '../contracts/addresses';
import { SUBSCRIPTION_ABI } from '../contracts/abis/subscription';
import { BOT_REGISTRY_ABI } from '../contracts/abi';
import { BOT_REGISTRY_CONTRACT_ADDRESS } from '../contracts/addresses';
import { USDT_CONTRACT_ADDRESS } from '../contracts/addresses';
import { USDT_ABI } from '../contracts/abis/usdt';
import { getBot } from './botService';
import { BOT_PAYMENT_CONTRACT_ADDRESS } from '../contracts/addresses';
import { BOT_PAYMENT_ABI } from '../contracts/abis/botPayment';

// 定义可用的订阅周期（月）
export const SUBSCRIPTION_PERIODS = [3, 6, 12] as const;

interface ContractError extends Error {
  code?: string;
  data?: string;
  transaction?: {
    data: string;
    to: string;
    from: string;
  };
}

export const subscribe = async (botId: number, durationInDays: number, autoRenew: boolean) => {
  try {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask');
    }

    // 1. 检查机器人是否已发布
    const bot = await getBot(botId);
    if (bot.status !== 'published') {
      throw new Error('机器人未发布到区块链，请先完成发布流程');
    }

    // 2. 获取合约中的机器人ID
    if (!bot.contract_bot_id) {
      throw new Error('机器人未在合约中注册');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const paymentContract = new ethers.Contract(BOT_PAYMENT_CONTRACT_ADDRESS, BOT_PAYMENT_ABI, signer);
    const registryContract = new ethers.Contract(BOT_REGISTRY_CONTRACT_ADDRESS, BOT_REGISTRY_ABI, signer);
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);

    // 检查网络
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111) { // Sepolia 测试网
      throw new Error('请切换到 Sepolia 测试网');
    }

    console.log('订阅参数:', {
      botId: bot.contract_bot_id,
      durationInDays,
      autoRenew,
      contractAddress: BOT_PAYMENT_CONTRACT_ADDRESS,
      network: network.name
    });

    try {
      // 获取机器人详情
      const botDetails = await registryContract.getBotDetails(bot.contract_bot_id);
      const [, pricePerPeriod, , , , , isActive] = botDetails;
      
      if (!isActive) {
        throw new Error('机器人未激活');
      }

      console.log('原始月价格:', ethers.utils.formatUnits(pricePerPeriod, 6), 'USDT');
      
      // 计算每日价格（将月价格除以30天）
      // 使用 ethers.utils 来处理大数计算，避免精度损失
      const pricePerDay = pricePerPeriod.div(30);
      console.log('每日价格:', ethers.utils.formatUnits(pricePerDay, 6), 'USDT');
      
      // 计算总价
      const amount = pricePerDay.mul(durationInDays);
      const formattedAmount = ethers.utils.formatUnits(amount, 6);
      console.log('订阅总价:', formattedAmount, 'USDT');

      // 检查 USDT 余额
      const balance = await usdtContract.balanceOf(await signer.getAddress());
      const formattedBalance = ethers.utils.formatUnits(balance, 6);
      console.log('当前USDT余额:', formattedBalance);
      
      if (balance.lt(amount)) {
        throw new Error(`USDT 余额不足，当前余额: ${formattedBalance} USDT，需要: ${formattedAmount} USDT`);
      }

      // 检查授权额度
      const allowance = await usdtContract.allowance(await signer.getAddress(), BOT_PAYMENT_CONTRACT_ADDRESS);
      if (allowance.lt(amount)) {
        console.log('正在授权 USDT...');
        const approveTx = await usdtContract.approve(BOT_PAYMENT_CONTRACT_ADDRESS, amount);
        await approveTx.wait();
        console.log('USDT 授权成功');
      }

      // 发送支付交易（通过 BotPayment 合约）
      const tx = await paymentContract.processPayment(
        ethers.BigNumber.from(bot.contract_bot_id),
        amount,
        ethers.BigNumber.from(durationInDays),
        { gasLimit: 500000 }
      );

      console.log('交易已发送:', tx.hash);
      const receipt = await tx.wait();
      console.log('交易已确认:', receipt);

      return receipt;
    } catch (contractError: unknown) {
      const error = contractError as ContractError;
      console.error('合约调用失败:', error);
      
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error('合约调用失败，请确保：1. 已切换到正确的网络 2. 合约地址正确 3. 有足够的 Gas 费');
      }
      
      if (error.message?.includes('Payment failed')) {
        throw new Error('USDT 转账失败，请确保：1. 已授权足够的 USDT 2. 余额充足');
      }
      
      throw error;
    }
  } catch (error: unknown) {
    console.error('订阅失败:', error);
    if (error instanceof Error) {
      if (error.message.includes('user denied')) {
        throw new Error('用户拒绝了交易');
      }
      throw error;
    }
    throw new Error('未知错误');
  }
};

export async function getSubscriptionStatus(botId: number): Promise<Subscription['status']> {
  try {
    if (!window.ethereum) {
      throw new Error('未检测到 MetaMask');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
      BOT_SUBSCRIPTION_CONTRACT_ADDRESS,
      SUBSCRIPTION_ABI,
      provider
    );
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    const subscription = await contract.getSubscription(address, botId);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 检查是否在试用期
    const isInTrial = await contract.isTrialActive(address, botId);
    if (isInTrial) {
      return 'trial';
    }
    
    // 检查订阅状态
    if (subscription.endTime > currentTime) {
      return 'active';
    } else if (subscription.status === 3) { // 3 对应 Expired 状态
      return 'expired';
    } else {
      return 'cancelled';
    }
  } catch (error) {
    console.error('获取订阅状态时发生错误:', error);
    throw error;
  }
} 