import React, { useState } from 'react';
import styles from '../styles/components/UserManagementModal.module.css';
import { useAuth } from '../hooks/useAuth';

import { useUserManagementModal } from '../contexts/UserManagementModalContext';

const UserManagementModal: React.FC = () => {
  const { user, logout, deleteUser } = useAuth();
  const { isModalOpen, closeModal } = useUserManagementModal();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isModalOpen) return null;

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      closeModal();
    } catch (error) {
      console.error('删除账号失败:', error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>User information</h2>
        {user ? (
          <>
            <p>email: {user.email}</p>
            <p>role: {user.role}</p>
            <p>wallet address: {user.wallets ? Object.keys(user.wallets).join(', ') : 'No wallet bound'}</p>
            
            <div className={styles.buttonGroup}>
              <button onClick={logout}>Logout</button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className={styles.deleteButton}
              >
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className={styles.confirmDialog}>
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                <div className={styles.confirmButtons}>
                  <button onClick={handleDeleteAccount}>Yes, Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>请登录以查看用户信息。</p>
        )}
        <button onClick={closeModal}>Quit</button>
      </div>
    </div>
  );
};

export default UserManagementModal;
