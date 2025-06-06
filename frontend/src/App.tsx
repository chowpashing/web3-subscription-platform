import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './styles/App.css';
import { UserManagementModalProvider } from './contexts/UserManagementModalContext';

function App() {
  return (
    <UserManagementModalProvider>
      <RouterProvider router={router} />
    </UserManagementModalProvider>
  );
}

export default App;
