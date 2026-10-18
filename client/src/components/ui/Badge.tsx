import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}
