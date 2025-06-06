import { SDKConfig, SDKError, SDKErrorType } from '../core/types';
import { ERROR_MESSAGES } from '../core/constants';

// 验证SDK配置
export function validateConfig(config: SDKConfig): void {
  if (!config.contractAddress) {
    throw new SDKError(
      SDKErrorType.INVALID_CONFIG,
      'Contract address is required'
    );
  }

  if (!config.apiEndpoint) {
    throw new SDKError(
      SDKErrorType.INVALID_CONFIG,
      'API endpoint is required'
    );
  }

  if (config.cacheTimeout && config.cacheTimeout < 0) {
    throw new SDKError(
      SDKErrorType.INVALID_CONFIG,
      'Cache timeout must be positive'
    );
  }
}

// 验证订阅状态
export function validateSubscriptionStatus(status: any): boolean {
  if (!status) return false;
  
  return (
    typeof status.isActive === 'boolean' &&
    typeof status.botId === 'string' &&
    typeof status.userId === 'string' &&
    (!status.expirationDate || status.expirationDate instanceof Date) &&
    (!status.trialEndTime || status.trialEndTime instanceof Date)
  );
}

// 验证访问结果
export function validateAccessResult(result: any): boolean {
  if (!result) return false;
  
  return (
    typeof result.hasAccess === 'boolean' &&
    (!result.subscriptionStatus || validateSubscriptionStatus(result.subscriptionStatus)) &&
    (!result.error || typeof result.error === 'string')
  );
}
