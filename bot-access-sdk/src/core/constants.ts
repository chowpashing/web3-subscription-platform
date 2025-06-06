// 默认缓存超时时间（毫秒）
export const DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5分钟

// 合约ABI
export const SUBSCRIPTION_ABI = [
  'function getSubscription(address user, uint256 botId) view returns (tuple(uint256 startTime, uint256 endTime, uint256 trialEndTime, bool isActive))',
  'function isTrialActive(address user, uint256 botId) view returns (bool)'
];

// API端点
export const API_ENDPOINTS = {
  VERIFY_ACCESS: '/api/subscription/verify',
  GET_STATUS: '/api/subscription/status'
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  INVALID_CONFIG: 'Invalid SDK configuration',
  NETWORK_ERROR: 'Network request failed',
  CONTRACT_ERROR: 'Contract interaction failed',
  CACHE_ERROR: 'Cache operation failed',
  VALIDATION_ERROR: 'Validation failed'
} as const;
