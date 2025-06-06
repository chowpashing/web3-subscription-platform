import { useState, useEffect } from "react";
import { loginUser, registerUser, deleteAccount } from "../services/authService";
import { loginWithWallet, bindEmailAndRole } from "../services/web3AuthService";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pendingWalletAddress, setPendingWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 检查是否已经登录
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // 调用后端API验证token并获取用户信息
          const response = await fetch('http://localhost:8000/api/user/user-detail/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            console.error('Token验证失败:', response.status, response.statusText);
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          console.error('验证token失败:', error);
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 传统登录方法
  // 添加一个通用的导航函数
  const navigateByRole = (role?: string) => {
    if (role === 'developer') {
      navigate("/botmanage");
    } else {
      navigate("/bots");  // 默认用户页面
    }
  };

  // 修改传统登录方法
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await loginUser(email, password);
      setUser(data.user);
      localStorage.setItem("token", data.access);
      navigateByRole(data.user.role);  // 使用角色判断跳转
    } catch (error) {
      console.error("传统登录失败:", error);
      setError("Login failed, please check your email and password");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Web3 wallet login method
  const walletLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loginWithWallet();
      
      if (data.needs_setup) {
        setPendingWalletAddress(data.wallet_address);
        setNeedsSetup(true);
        return;
      }
      
      setUser(data.user);
      localStorage.setItem("token", data.access);
      navigateByRole(data.user.role);  // 使用角色判断跳转
    } catch (error) {
      console.error("Wallet login failed:", error);
      setError("Wallet login failed, please try again");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const completeWalletSetup = async (email: string, role: string) => {
    if (!pendingWalletAddress) {
      throw new Error("No pending wallet address");
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await bindEmailAndRole(pendingWalletAddress, email, role);
      
      setUser(data.user);
      localStorage.setItem("token", data.access);
      
      setNeedsSetup(false);
      setPendingWalletAddress(null);
      
      navigateByRole(role);  // 使用设置的角色进行跳转
    } catch (error) {
      console.error("Setup failed:", error);
      setError("Setup failed, please try again");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // register method
  const register = async (email: string, password: string, role: string, password2: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await registerUser(email, password, role, password2);
      setUser(data.user);
      localStorage.setItem("token", data.access);
      navigateByRole(role);  // 使用注册时选择的角色进行跳转
    } catch (error) {
      console.error("Registration failed:", error);
      setError("Registration failed, please try again or use a different email");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  // 删除账号方法
  const deleteUser = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteAccount();
      localStorage.removeItem("token");
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("删除账号失败:", error);
      setError("Failed to delete account, please try again");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    user, 
    loading, 
    error,
    login, 
    walletLogin,
    register,
    logout,
    deleteUser,
    needsSetup,
    pendingWalletAddress,
    completeWalletSetup
  };
};