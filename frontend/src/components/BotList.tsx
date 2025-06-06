import React from 'react';
import { Card, Button, Tag, Tooltip } from 'antd';
import { Bot } from '../types/bot';
import styles from '../styles/components/BotList.module.css';

interface BotListProps {
  bots: Bot[];
  onEdit: (bot: Bot) => void;
  onDelete: (bot: Bot) => Promise<void>;
  onPublish: (bot: Bot) => void;
}

const BotList: React.FC<BotListProps> = ({ bots, onEdit, onDelete, onPublish }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className={styles.botList}>
      {bots.map((bot) => (
        <Card
          key={bot.id}
          title={bot.name}
          className={styles.botCard}
          extra={<Tag color={bot.status === 'published' ? 'green' : 'orange'}>
            {bot.status === 'published' ? 'Published' : 'Draft'}
          </Tag>}
        >
          <div className={styles.botInfo}>
            <p className={styles.description}>{bot.description}</p>
            <div className={styles.details}>
              <p>
                <strong>Price: </strong>
                {bot.price} USDT
              </p>
              <p>
                <strong>Trial Period: </strong>
                {bot.trial_time} days
              </p>
              <p>
                <strong>Created At: </strong>
                {formatDate(bot.created_at)}
              </p>
              {bot.ipfs_hash && (
                <p>
                  <strong>IPFS: </strong>
                  <Tooltip title={`View details on IPFS`}>
                    <a
                      href={`https://ipfs.io/ipfs/${bot.ipfs_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bot.ipfs_hash.slice(0, 6)}...{bot.ipfs_hash.slice(-4)}
                    </a>
                  </Tooltip>
                </p>
              )}
            </div>
            <div className={styles.actions}>
              <Button type="primary" onClick={() => onEdit(bot)}>
                Edit
              </Button>
              <Button danger onClick={() => onDelete(bot)} style={{ marginLeft: 8 }}>
                Delete
              </Button>
              {bot.status !== 'published' && (
                <Button onClick={() => onPublish(bot)} style={{ marginLeft: 8 }}>
                  Publish
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BotList;