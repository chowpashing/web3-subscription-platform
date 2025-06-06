import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // 如果正在加载，可以显示加载状态或返回null
  if (loading) {
    return null; // 或者返回一个加载指示器组件
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 如果用户已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;