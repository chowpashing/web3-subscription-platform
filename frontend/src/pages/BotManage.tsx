import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/pages/Bots.module.css';
import UserManagementModal from '../components/UserManagementModel';
import UploadBotForm from '../components/UploadBotForm';
import BotList from '../components/BotList';
import PublishBotModal from '../components/PublishBotModal';
import { useBotUpload } from '../hooks/useBotUpload';
import { useUserManagementModal } from '../contexts/UserManagementModalContext';
import { getBots, deleteBot } from '../services/botService';
import { Bot } from '../types/bot';

const BotManage = () => {
  const { isLoading, handleUpload } = useBotUpload();
  const { openModal } = useUserManagementModal();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const botList = await getBots();
      if (Array.isArray(botList)) {
        setBots(botList);
      } else {
        console.error('Bot list data format error');
        setBots([]);
      }
    } catch (err) {
      console.error('Failed to load bot list:', err);
      setBots([]);
    }
  };

  const handleDelete = async (bot: Bot) => {
    try {
      await deleteBot(bot.id);
      setBots(bots.filter(b => b.id !== bot.id));
    } catch (err) {
      console.error('Failed to delete bot:', err);
      setError('Failed to delete bot, please try again later');
    }
  };

  const handleBotUpload = async (formData: FormData) => {
    setError(null);
    const success = await handleUpload(formData);
    if (success) {
      await loadBots();
      setShowForm(false);
      setEditingBot(null);
    }
  };

  const handlePublishClick = (bot: Bot) => {
    setSelectedBot(bot);
    setPublishModalVisible(true);
  };

  const handleEditBot = (bot: Bot) => {
    setEditingBot(bot);
    setShowForm(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bot Management</h1>
        <div className={styles.headerButtons}>
          <button 
            className={styles.userManagementButton}
            onClick={openModal}
          >
            User Management
          </button>
          <button 
            className={styles.addButton}
            onClick={() => {
              setEditingBot(null);
              setShowForm(true);
            }}
          >
            Add Bot
          </button>
          <button 
            className={styles.devSubscriptionButton}
            onClick={() => navigate('/dev-subscription')}
          >
            Dev Subscription
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formContainer}>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setShowForm(false);
                setEditingBot(null);
              }}
            >
              ×
            </button>
            <UploadBotForm
              onSubmit={handleBotUpload}
              onError={setError}
              isLoading={isLoading}
              editingBot={editingBot}
            />
          </div>
        </div>
      )}

      <BotList
        bots={bots}
        onEdit={handleEditBot}
        onDelete={handleDelete}
        onPublish={handlePublishClick}
      />

      <UserManagementModal />

      {selectedBot && (
        <PublishBotModal
          bot={selectedBot}
          visible={publishModalVisible}
          onSuccess={() => {
            setPublishModalVisible(false);
            loadBots();
          }}
          onCancel={() => {
            setPublishModalVisible(false);
            setSelectedBot(null);
          }}
        />
      )}
    </div>
  );
};

export default BotManage;