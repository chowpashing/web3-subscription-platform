import { Subscription } from '../types/subscription';
import { ethers } from 'ethers';
import { 
  NEW_BOT_SUBSCRIPTION_CONTRACT_ADDRESS as BOT_SUBSCRIPTION_CONTRACT_ADDRESS,
  NEW_BOT_REGISTRY_CONTRACT_ADDRESS as BOT_REGISTRY_CONTRACT_ADDRESS,
  NEW_USDT_CONTRACT_ADDRESS as USDT_CONTRACT_ADDRESS,
  NEW_BOT_PAYMENT_CONTRACT_ADDRESS as BOT_PAYMENT_CONTRACT_ADDRESS,
  OP_SEPOLIA_CONFIG as NETWORK_CONFIG
} from '../contracts/addresses';
import { SUBSCRIPTION_ABI } from '../contracts/abis/subscription';
import { BOT_REGISTRY_ABI } from '../contracts/abi';
import { USDT_ABI } from '../contracts/abis/usdt';
import { getBot, } from './botService';
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

    // 1. 获取机器人信息并打印详细日志
    const bot = await getBot(botId);
    console.log('Bot 详情:', {
      id: bot.id,
      contract_bot_id: bot.contract_bot_id,
      name: bot.name,
      price: bot.price,
      status: bot.status
    });

    // 2. 检查机器人状态
    if (bot.status !== 'published') {
      throw new Error('机器人未发布到区块链，请先完成发布流程');
    }

    // 3. 检查合约ID
    if (!bot.contract_bot_id) {
      throw new Error('机器人未在合约中注册');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const paymentContract = new ethers.Contract(BOT_PAYMENT_CONTRACT_ADDRESS, BOT_PAYMENT_ABI, signer);
    const registryContract = new ethers.Contract(BOT_REGISTRY_CONTRACT_ADDRESS, BOT_REGISTRY_ABI, signer);
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);

    // 4. 检查网络
    const network = await provider.getNetwork();
    console.log('当前网络:', {
      chainId: network.chainId,
      name: network.name,
      expectedChainId: NETWORK_CONFIG.chainId,
      expectedName: NETWORK_CONFIG.chainName
    });

    if (network.chainId !== NETWORK_CONFIG.chainId) {
      throw new Error(`请切换到 ${NETWORK_CONFIG.chainName}`);
    }

    // 5. 获取机器人链上详情
    const botDetails = await registryContract.getBotDetails(bot.contract_bot_id);
    console.log('链上机器人详情:', {
      ipfsHash: botDetails[0],
      price: ethers.utils.formatUnits(botDetails[1], 6),
      trialTime: botDetails[2].toString(),
      name: botDetails[3],
      developer: botDetails[4],
      isActive: botDetails[5],
      exists: botDetails[6]
    });

    const [, price, , , , isActive, exists] = botDetails;

    // 6. 检查机器人状态
    if (!exists) {
      throw new Error('机器人在链上不存在');
    }
    
    if (!isActive) {
      throw new Error('机器人未激活');
    }

    // 7. 计算价格
    const monthsCount = Math.ceil(durationInDays / 30);
    const amount = price.mul(monthsCount);
    const actualDays = monthsCount * 30; 
    
    console.log('价格计算详情:', {
      原始价格每月: ethers.utils.formatUnits(price, 6),
      月数: monthsCount,
      总价: ethers.utils.formatUnits(amount, 6)
    });

    // 8. 检查余额
    const userAddress = await signer.getAddress();
    const balance = await usdtContract.balanceOf(userAddress);
    console.log('用户USDT余额:', {
      address: userAddress,
      balance: ethers.utils.formatUnits(balance, 6),
      required: ethers.utils.formatUnits(amount, 6)
    });

    if (balance.lt(amount)) {
      throw new Error(`USDT 余额不足，当前余额: ${ethers.utils.formatUnits(balance, 6)} USDT，需要: ${ethers.utils.formatUnits(amount, 6)} USDT`);
    }

    // 9. 检查授权
    const allowance = await usdtContract.allowance(userAddress, BOT_PAYMENT_CONTRACT_ADDRESS);
    console.log('USDT授权情况:', {
      当前授权额度: ethers.utils.formatUnits(allowance, 6),
      需要额度: ethers.utils.formatUnits(amount, 6)
    });

    if (allowance.lt(amount)) {
      console.log('正在授权 USDT...');
      const approveTx = await usdtContract.approve(BOT_PAYMENT_CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      console.log('USDT 授权成功');
    }

    // 10. 发送支付交易
    console.log('准备发送支付交易:', {
      contract_bot_id: bot.contract_bot_id.toString(),
      amount: ethers.utils.formatUnits(amount, 6),
      durationInDays: durationInDays.toString(),
      gasLimit: 500000
    });
    const tokenAddress = USDT_CONTRACT_ADDRESS;
    const tx = await paymentContract.processPayment(
    ethers.BigNumber.from(bot.contract_bot_id),
    tokenAddress,
    amount,
    ethers.BigNumber.from(actualDays),   
    { gasLimit: 500000 }
   );
   

    console.log('交易已发送:', tx.hash);
    const receipt = await tx.wait();
    console.log('交易已确认:', receipt);

    return receipt;
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

// 使用 permit 进行支付的方法
export const subscribeWithPermit = async (
  botId: number,
  durationInDays: number,
  amount: ethers.BigNumber,
  deadline: number,
  v: number,
  r: string,
  s: string
) => {
  try {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask');
    }

    // 检查网络
    const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
    const network = await provider.getNetwork();
    if (network.chainId !== NETWORK_CONFIG.chainId) {
      throw new Error(`请切换到 ${NETWORK_CONFIG.chainName}`);
    }

    const signer = provider.getSigner();
    const paymentContract = new ethers.Contract(
      BOT_PAYMENT_CONTRACT_ADDRESS,
      BOT_PAYMENT_ABI,
      signer
    );

    console.log('使用 permit 支付，参数:', {
      botId,
      token: USDT_CONTRACT_ADDRESS,
      durationInDays,
      amount: ethers.utils.formatUnits(amount, 6),
      deadline: new Date(deadline * 1000).toISOString(),
      v,
      r,
      s
    });

    // 调用支持 permit 的支付函数
    const tx = await paymentContract.processPaymentWithPermit(
      ethers.BigNumber.from(botId),
      USDT_CONTRACT_ADDRESS,
      amount,
      ethers.BigNumber.from(durationInDays),
      deadline,
      v,
      r,
      s,
      { gasLimit: 600000 }
    );

    console.log('交易已发送:', tx.hash);
    const receipt = await tx.wait();
    console.log('交易已确认:', receipt);

    return receipt;
  } catch (error: unknown) {
    console.error('使用 permit 支付失败:', error);
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