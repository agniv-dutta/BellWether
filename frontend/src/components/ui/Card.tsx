import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'paper' | 'blush' | 'mesh' | 'oxblood';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'blush',
  hoverEffect = false,
  onClick,
}) => {
  const variantClasses = {
    paper: 'bg-paper text-oxblood border border-blush/60',
    blush: 'bg-blush/60 text-oxblood border border-apricot/30',
    mesh: 'mesh-soft text-oxblood border border-apricot/40',
    oxblood: 'bg-oxblood text-paper border border-oxblood/80',
  };

  const hoverClasses = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-oxblood-md'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-6 shadow-oxblood-sm ${variantClasses[variant]} ${hoverClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
