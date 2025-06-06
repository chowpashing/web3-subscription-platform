import { ethers } from 'ethers';

// SDK配置接口
export interface SDKConfig {
  contractAddress: string;
  apiEndpoint: string;
  cacheTimeout?: number;
  provider?: ethers.providers.Provider;
}

// 订阅状态接口
export interface SubscriptionStatus {
  isActive: boolean;
  expirationDate?: Date;
  trialEndTime?: Date;
  botId: string;
  userId: string;
}

// 访问验证结果接口
export interface AccessResult {
  hasAccess: boolean;
  subscriptionStatus?: SubscriptionStatus;
  error?: string;
}

// 缓存接口
export interface CacheData {
  status: SubscriptionStatus;
  timestamp: number;
}

// 错误类型
export enum SDKErrorType {
  INVALID_CONFIG = 'INVALID_CONFIG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// SDK错误类
export class SDKError extends Error {
  constructor(
    public type: SDKErrorType,
    message: string
  ) {
    super(message);
    this.name = 'SDKError';
  }
}
