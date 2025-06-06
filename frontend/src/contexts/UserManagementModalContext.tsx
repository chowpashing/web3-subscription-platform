import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserManagementModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const UserManagementModalContext = createContext<UserManagementModalContextType | undefined>(undefined);

export const UserManagementModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <UserManagementModalContext.Provider
      value={{
        isModalOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
    </UserManagementModalContext.Provider>
  );
};

export const useUserManagementModal = () => {
  const context = useContext(UserManagementModalContext);
  if (context === undefined) {
    throw new Error('useUserManagementModal must be used within a UserManagementModalProvider');
  }
  return context;
};