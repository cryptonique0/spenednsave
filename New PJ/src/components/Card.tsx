import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  border?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  border = true,
  shadow = 'md',
  onClick,
}) => {
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    none: 'shadow-none',
  };

  const borderClass = border ? 'border border-gray-200 dark:border-gray-700' : '';
  const hoverClass = hover ? 'hover:shadow-lg dark:hover:shadow-2xl transition-shadow cursor-pointer' : '';

  return (
    <div
      className={`rounded-lg bg-white dark:bg-gray-900 ${borderClass} ${shadowClasses[shadow]} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
