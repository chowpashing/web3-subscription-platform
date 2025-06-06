import React from 'react';
import { Card, Button, Spin, Tag, Tooltip } from 'antd';
import { Bot } from '../types/bot';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/PublishedBotList.module.css';

interface PublishedBotListProps {
  bots: Bot[];
  loading?: boolean;
}

const PublishedBotList: React.FC<PublishedBotListProps> = ({ bots, loading }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleSubscribe = (bot: Bot) => {
    navigate(`/bots/${bot.id}`, { state: { bot } });
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className={styles.botList}>
      {bots.length === 0 ? (
        <div className={styles.botItem}>
          <p>No published bots yet</p>
        </div>
      ) : (
        bots.map((bot) => (
          <Card key={bot.id} className={styles.botCard}>
            <div className={styles.botInfo}>
              <h3>{bot.name} <Tag color="green">Published</Tag></h3>
              <p>{bot.description}</p>
              <div className={styles.botDetails}>
                <span>Price: {bot.price} USDT</span>
                <span>Trial Period: {bot.trial_time} days</span>
                <span>Published Time: {formatDate(bot.created_at)}</span>
                {bot.ipfs_hash && (
                  <Tooltip title={`View details on IPFS`}>
                    <a
                      href={`https://ipfs.io/ipfs/${bot.ipfs_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      IPFS: {bot.ipfs_hash.slice(0, 6)}...{bot.ipfs_hash.slice(-4)}
                    </a>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className={styles.botActions}>
              <Button type="primary" onClick={() => handleSubscribe(bot)}>
                Subscribe
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default PublishedBotList;