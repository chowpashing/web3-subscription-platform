import { ethers } from 'ethers';
import { SDKConfig, AccessResult, SubscriptionStatus, SDKError, SDKErrorType } from './types';
import { SUBSCRIPTION_ABI } from './constants';
import { validateConfig } from '../utils/validation';
import Cache from '../utils/cache';
import ApiClient from '../api/client';

export class BotAccessSDK {
  private config: SDKConfig;
  private cache: Cache;
  private apiClient: ApiClient;
  private contract: ethers.Contract;

  constructor(config: SDKConfig) {
    validateConfig(config);
    this.config = config;
    this.cache = new Cache(config.cacheTimeout);
    this.apiClient = new ApiClient(config);
    
    // 初始化合约
    const provider = config.provider || new ethers.providers.Web3Provider(window.ethereum);
    this.contract = new ethers.Contract(
      config.contractAddress,
      SUBSCRIPTION_ABI,
      provider
    );
  }

  // 验证访问权限
  async verifyAccess(botId: string): Promise<AccessResult> {
    try {
      // 获取当前用户地址
      const signer = this.contract.signer;
      const userAddress = await signer.getAddress();

      // 检查缓存
      const cacheKey = `${userAddress}-${botId}`;
      const cachedStatus = this.cache.get(cacheKey);
      if (cachedStatus) {
        return {
          hasAccess: cachedStatus.isActive,
          subscriptionStatus: cachedStatus
        };
      }

      // 获取链上订阅状态
      const subscription = await this.contract.getSubscription(userAddress, botId);
      const isTrial = await this.contract.isTrialActive(userAddress, botId);

      // 获取API订阅状态
      const apiStatus = await this.apiClient.getSubscriptionStatus(botId, userAddress);

      // 合并状态
      const status: SubscriptionStatus = {
        isActive: subscription.isActive || isTrial,
        expirationDate: new Date(Number(subscription.endTime) * 1000),
        trialEndTime: new Date(Number(subscription.trialEndTime) * 1000),
        botId,
        userId: userAddress
      };

      // 更新缓存
      this.cache.set(cacheKey, status);

      return {
        hasAccess: status.isActive,
        subscriptionStatus: status
      };
    } catch (error) {
      throw new SDKError(
        SDKErrorType.VALIDATION_ERROR,
        'Failed to verify access'
      );
    }
  }

  // 获取订阅状态
  async getSubscriptionStatus(botId: string): Promise<SubscriptionStatus> {
    try {
      const signer = this.contract.signer;
      const userAddress = await signer.getAddress();
      return await this.apiClient.getSubscriptionStatus(botId, userAddress);
    } catch (error) {
      throw new SDKError(
        SDKErrorType.VALIDATION_ERROR,
        'Failed to get subscription status'
      );
    }
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }
}
