export interface Bot {
  id: number;
  name: string;
  description: string;
  price: number;
  trial_time: number;
  status: 'draft' | 'published';
  image1: string;
  image2?: string;
  image3?: string;
  external_link?: string;
  created_at: string;
  ipfs_hash?: string;
  ipfs_status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  is_ipfs_locked: boolean;
  developer: string;
  contract_bot_id?: number;
}

export interface BotFormData {
  name: string;
  description: string;
  price: number;
  trial_time: number;
  image1?: File;
  image2?: File;
  image3?: File;
  external_link?: string;
}

export interface PublishBotData {
  ipfsHash: string;
  price: string;
  trialTime: number;
  name: string;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
}

export interface PublishConfirmResponse {
  status: 'success';
  message: string;
  data: {
    transaction_hash: string;
    ipfs_hash: string;
    ipfs_url: string;
  };
}