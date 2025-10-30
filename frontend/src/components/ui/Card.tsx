/**
 * Card Components
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`card-header ${className}`}>{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`card-content ${className}`}>{children}</div>;
};

interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const CardActions: React.FC<CardActionsProps> = ({ children, className = '' }) => {
  return <div className={`card-actions ${className}`}>{children}</div>;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string | React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  trend,
  className = '',
}) => {
  return (
    <Card className={`stat-card ${className}`}>
      <CardContent>
        <div className="stat-card-header">
          {icon && <span className="stat-icon">{icon}</span>}
          <span className="stat-title">{title}</span>
        </div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change stat-change-${trend || 'neutral'}`}>
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
