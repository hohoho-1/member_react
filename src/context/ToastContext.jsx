import { createContext, useContext } from 'react';
import { useToast, ToastContainer } from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { toasts, remove, success, error, warning, info, toast } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, warning, info, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  return useContext(ToastContext);
}
