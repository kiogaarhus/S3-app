/**
 * Badge Component
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import React from 'react';
import './Badge.css';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'default'
  | 'primary'
  | 'separering'
  | 'aabentland'
  | 'other';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = ''
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
