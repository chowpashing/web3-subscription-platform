import { CacheData, SubscriptionStatus, SDKError, SDKErrorType } from '../core/types';
import { DEFAULT_CACHE_TIMEOUT } from '../core/constants';

class Cache {
  private cache: Map<string, CacheData> = new Map();
  private timeout: number;

  constructor(timeout: number = DEFAULT_CACHE_TIMEOUT) {
    this.timeout = timeout;
  }

  // 设置缓存
  set(key: string, status: SubscriptionStatus): void {
    try {
      this.cache.set(key, {
        status,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new SDKError(
        SDKErrorType.CACHE_ERROR,
        'Failed to set cache'
      );
    }
  }

  // 获取缓存
  get(key: string): SubscriptionStatus | null {
    try {
      const data = this.cache.get(key);
      if (!data) return null;

      // 检查缓存是否过期
      if (Date.now() - data.timestamp > this.timeout) {
        this.cache.delete(key);
        return null;
      }

      return data.status;
    } catch (error) {
      throw new SDKError(
        SDKErrorType.CACHE_ERROR,
        'Failed to get cache'
      );
    }
  }

  // 清除缓存
  clear(): void {
    try {
      this.cache.clear();
    } catch (error) {
      throw new SDKError(
        SDKErrorType.CACHE_ERROR,
        'Failed to clear cache'
      );
    }
  }

  // 删除特定缓存
  delete(key: string): void {
    try {
      this.cache.delete(key);
    } catch (error) {
      throw new SDKError(
        SDKErrorType.CACHE_ERROR,
        'Failed to delete cache'
      );
    }
  }
}

export default Cache;
