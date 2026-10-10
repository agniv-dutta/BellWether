import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'alert' | 'success';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    info: 'bg-blush border-apricot text-oxblood',
    alert: 'bg-vermilion text-paper border-vermilion',
    success: 'bg-hibiscus text-paper border-hibiscus',
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl border shadow-oxblood-md font-medium text-sm transition-all duration-300 ${typeStyles[type]}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-80 hover:opacity-100 text-lg leading-none cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
};
