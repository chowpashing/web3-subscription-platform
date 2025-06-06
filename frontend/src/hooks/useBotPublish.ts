import { useState } from 'react';
import { publishBot } from '../services/botService';
import axios from 'axios';

export const useBotPublish = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublish = async (botId: number) => {
    setIsPublishing(true);
    setPublishError(null);
    
    try {
      await publishBot(botId);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPublishError(err.response?.data?.message || '上架失败，请稍后重试');
      } else {
        setPublishError('上架失败，请稍后重试');
      }
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isPublishing,
    publishError,
    handlePublish
  };
}; 