// Système de notifications toast élégant pour le garde-manger
// app/components/Toast.js

'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

let toastId = 0;
let showToastFunction = null;

// Types de toast
const TOAST_TYPES = {
  success: { icon: CheckCircle, color: 'green' },
  error: { icon: XCircle, color: 'red' },
  warning: { icon: AlertCircle, color: 'orange' },
  info: { icon: Info, color: 'blue' }
};

// Fonction globale pour afficher un toast
export const toast = {
  success: (message) => showToastFunction?.(message, 'success'),
  error: (message) => showToastFunction?.(message, 'error'),
  warning: (message) => showToastFunction?.(message, 'warning'),
  info: (message) => showToastFunction?.(message, 'info')
};

// Composant Toast individuel
function ToastItem({ toast, onRemove }) {
  const { icon: Icon, color } = TOAST_TYPES[toast.type];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${color}`}>
      <div className="toast-content">
        <Icon size={20} className="toast-icon" />
        <span className="toast-message">{toast.message}</span>
      </div>
      <button 
        onClick={() => onRemove(toast.id)} 
        className="toast-close"
      >
        ×
      </button>
    </div>
  );
}

// Conteneur principal des toasts
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = ++toastId;
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Enregistrer la fonction globalement
  useEffect(() => {
    showToastFunction = addToast;
    return () => {
      showToastFunction = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={removeToast} 
        />
      ))}
    </div>
  );
}