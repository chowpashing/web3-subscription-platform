import React from 'react';
import AuthForm from "../components/AuthForm";
import WalletSetupForm from "../components/WalletSetupForm";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const { 
    login, 
    walletLogin, 
    needsSetup, 
    pendingWalletAddress, 
    completeWalletSetup,
    register,
    loading,
    error
  } = useAuth();

  if (needsSetup && pendingWalletAddress) {
    return (
      <WalletSetupForm 
        walletAddress={pendingWalletAddress} 
        onComplete={completeWalletSetup}
        error={error}
        loading={loading}
      />
    );
  }

  const handleRegister = async (email: string, password: string, role: string, password2: string) => {
    try {
      await register(email, password, role, password2);
    } catch {
      // 错误已在useAuth中处理
    }
  };

  return (
    <AuthForm 
      onLogin={login} 
      onWalletLogin={walletLogin} 
      onRegister={handleRegister}
      error={error}
      loading={loading}
    />
  );
};

export default Login;