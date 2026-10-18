import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 shadow-lg">
      <p className="text-sm text-zinc-100">{message}</p>
    </div>
  );
}
