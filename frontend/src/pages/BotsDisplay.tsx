import React, { useState, useEffect } from 'react';
import { message, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/pages/BotsDisplay.module.css';
import { useUserManagementModal } from '../contexts/UserManagementModalContext';
import PublishedBotList from '../components/PublishedBotList';
import UserManagementModel from '../components/UserManagementModel';
import { getPublishedBots } from '../services/botService';
import { Bot } from '../types/bot';

const BotsDisplay: React.FC = () => {
  const { openModal } = useUserManagementModal();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublishedBots();
  }, []);

  const loadPublishedBots = async () => {
    try {
      setLoading(true);
      const data = await getPublishedBots();
      setBots(data);
    } catch (error) {
      setError('Failed to load bot list');
      message.error('Failed to load bot list');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <Button onClick={loadPublishedBots}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bot avaliable</h1>
        <Button type="primary" onClick={openModal}>
          User Management
        </Button>
        <Button type="primary" onClick={() => navigate('/subscription')}>
          Subscription Management
        </Button>
      </div>
      <PublishedBotList bots={bots} loading={loading} />
      <UserManagementModel />
    </div>
  );
};

export default BotsDisplay;