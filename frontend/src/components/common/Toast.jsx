import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

let toastListeners = [];

export const toast = {
  success: (title, message = '') => emitToast({ type: 'success', title, message }),
  error: (title, message = '') => emitToast({ type: 'error', title, message }),
  info: (title, message = '') => emitToast({ type: 'info', title, message })
};

function emitToast(toastData) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const item = { ...toastData, id };
  toastListeners.forEach(listener => listener(item));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (item) => {
      setToasts(prev => [item, ...prev].slice(0, 5));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== item.id));
      }, 4000);
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: t.type === 'success' ? 'rgba(6, 78, 59, 0.96)' : t.type === 'error' ? 'rgba(127, 29, 29, 0.96)' : 'rgba(15, 23, 42, 0.96)',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            border: `1px solid ${t.type === 'success' ? '#059669' : t.type === 'error' ? '#DC2626' : '#334155'}`
          }}
        >
          <div style={{ marginTop: '1px', flexShrink: 0 }}>
            {t.type === 'success' && <CheckCircle2 size={16} color="#34D399" />}
            {t.type === 'error' && <AlertCircle size={16} color="#F87171" />}
            {t.type === 'info' && <Info size={16} color="#60A5FA" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.3 }}>{t.title}</div>
            {t.message && (
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', marginTop: '2px', lineHeight: 1.35 }}>
                {t.message}
              </div>
            )}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
