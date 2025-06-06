import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import BotsDisplay from './pages/BotsDisplay';
import BotDetail from './pages/BotDetail';
import UserSubscription from './pages/UserSubscription';
import DevSubscription from './pages/DevSubscription';
import BotManage from './pages/BotManage';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/bots',
    element: <ProtectedRoute><BotsDisplay /></ProtectedRoute>,
  },
  {
    path: '/bots/:id',
    element: <ProtectedRoute><BotDetail /></ProtectedRoute>,
  },
  {
    path: '/user-subscription',
    element: <ProtectedRoute><UserSubscription /></ProtectedRoute>,
  },
  {
    path: '/subscription',
    element: <ProtectedRoute><UserSubscription /></ProtectedRoute>,
  },
  {
    path: '/dev-subscription',
    element: <ProtectedRoute><DevSubscription /></ProtectedRoute>,
  },
  {
    path: '/botmanage',
    element: <ProtectedRoute><BotManage /></ProtectedRoute>,
  },
]);