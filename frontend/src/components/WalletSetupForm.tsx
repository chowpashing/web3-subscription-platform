import React, { useState } from 'react';
import styles from '../styles/components/AuthForm.module.css';

interface WalletSetupFormProps {
  walletAddress: string;
  onComplete: (email: string, role: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

const WalletSetupForm: React.FC<WalletSetupFormProps> = ({ 
  walletAddress, 
  onComplete, 
  error: externalError, 
  loading: externalLoading 
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'consumer' | 'developer'>('consumer');
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // 使用外部或内部状态
  const loading = externalLoading || internalLoading;
  const error = externalError || internalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);
    setInternalLoading(true);

    try {
      await onComplete(email, role);
    } catch (err) {
      setInternalError('设置失败，请重试');
      console.error(err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>Complete Account Setup</h2>
        <p className={styles.walletNote}>Wallet Address: {walletAddress}</p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">Select Role</label>
            <div className={styles.roleSelector}>
              <button
                type="button"
                className={`${styles.roleButton} ${role === 'consumer' ? styles.activeRole : ''}`}
                onClick={() => setRole('consumer')}
                disabled={loading}
              >
                Investor
              </button>
              <button
                type="button"
                className={`${styles.roleButton} ${role === 'developer' ? styles.activeRole : ''}`}
                onClick={() => setRole('developer')}
                disabled={loading}
              >
                Bot Developer
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalletSetupForm;