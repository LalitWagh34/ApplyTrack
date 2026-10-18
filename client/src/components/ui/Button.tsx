import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button {...props}>
      {children}
    </button>
  );
}
