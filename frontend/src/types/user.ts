export type User = {
  id: string;
  email?: string;
  username: string;
  wallets?: Record<string, any>;
  role?: string;
};