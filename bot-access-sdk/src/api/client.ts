import axios, { AxiosInstance } from 'axios';
import { SDKConfig, SDKError, SDKErrorType, AccessResult, SubscriptionStatus } from '../core/types';
import { API_ENDPOINTS } from '../core/constants';

class ApiClient {
  private client: AxiosInstance;
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiEndpoint,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 验证访问权限
  async verifyAccess(botId: string, userId: string): Promise<AccessResult> {
    try {
      const response = await this.client.post(API_ENDPOINTS.VERIFY_ACCESS, {
        botId,
        userId
      });
      return response.data;
    } catch (error) {
      throw new SDKError(
        SDKErrorType.NETWORK_ERROR,
        'Failed to verify access'
      );
    }
  }

  // 获取订阅状态
  async getSubscriptionStatus(botId: string, userId: string): Promise<SubscriptionStatus> {
    try {
      const response = await this.client.get(API_ENDPOINTS.GET_STATUS, {
        params: {
          botId,
          userId
        }
      });
      return response.data;
    } catch (error) {
      throw new SDKError(
        SDKErrorType.NETWORK_ERROR,
        'Failed to get subscription status'
      );
    }
  }
}

export default ApiClient;
