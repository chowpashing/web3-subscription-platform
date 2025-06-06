export interface Subscription {
  id: number;
  botId: number;
  subscriber: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  autoRenew: boolean;
  amount: string;
}

export interface SubscriptionTransaction {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  amount: string;
  months: number;
}

export interface SubscriptionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} 