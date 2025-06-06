import { useState } from 'react';
import { createBot, uploadToIPFS } from '../services/botService';
import axios from 'axios';

export const useBotUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isIPFSUploading, setIsIPFSUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await createBot(formData);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || '上传失败，请检查网络连接');
      } else {
        setError('上传失败，请稍后重试');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleIPFSUpload = async (botId: number) => {
    setIsIPFSUploading(true);
    setError(null);
    
    try {
      await uploadToIPFS(botId);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'IPFS上传失败，请检查网络连接');
      } else {
        setError('IPFS上传失败，请稍后重试');
      }
      return false;
    } finally {
      setIsIPFSUploading(false);
    }
  };

  return {
    isLoading,
    isIPFSUploading,
    error,
    handleUpload,
    handleIPFSUpload
  };
};