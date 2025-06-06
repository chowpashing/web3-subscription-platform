import { useState } from "react";
import styles from '../styles/components/AuthForm.module.css';

interface AuthFormProps {
  onLogin: (email: string, password: string) => void;
  onWalletLogin: () => void;
  onRegister: (email: string, password: string, role: string, password2: string) => void;
  error?: string | null;
  loading?: boolean;
}

const AuthForm = ({ onLogin, onWalletLogin, onRegister, error, loading = false }: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "wallet">("login");
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState<"consumer" | "developer">("consumer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(email, password, role, password2);
    } else if (activeTab === "login") {
      onLogin(email, password);
    }
  };

  const toggleRegisterMode = () => {
    setIsRegistering(!isRegistering);
    setEmail("");
    setPassword("");
    setPassword2("");
  };
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>
          {activeTab === "wallet" ? "Wallet Login" : "Account Login"}
        </h2>
        
        <div className={styles.loginTypeTabs}>
          <button 
            className={`${styles.typeTab} ${activeTab === "login" ? styles.activeTab : ""}`}
            onClick={() => {
              setActiveTab("login");
              setIsRegistering(false);
            }}
          >
            Account
          </button>
          <button 
            className={`${styles.typeTab} ${activeTab === "wallet" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {activeTab === "login" && (
          <div>
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
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
              
              {isRegistering && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="password2">Confirm password</label>
                    <input
                      id="password2"
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      placeholder="Enter your password again"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="role">Select Role</label>
                    <div className={styles.roleSelector}>
                      <button
                        type="button"
                        className={`${styles.roleButton} ${role === "consumer" ? styles.activeRole : ""}`}
                        onClick={() => setRole("consumer")}
                        disabled={loading}
                      >
                        Investor
                      </button>
                      <button
                        type="button"
                        className={`${styles.roleButton} ${role === "developer" ? styles.activeRole : ""}`}
                        onClick={() => setRole("developer")}
                        disabled={loading}
                      >
                        Bot Developer
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={loading}
              >
                {loading 
                  ? (isRegistering ? "Registering..." : "Logging in...") 
                  : (isRegistering ? "Register" : "Login")}
              </button>
            </form>
            
            <div className={styles.switchAuthMode}>
              <button 
                onClick={toggleRegisterMode} 
                className={styles.switchButton}
                disabled={loading}
              >
                {isRegistering ? "Back to login" : "Create new account"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className={styles.walletLoginSection}>
            <button 
              onClick={onWalletLogin} 
              className={styles.walletLoginButton}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect MetaMask Wallet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;