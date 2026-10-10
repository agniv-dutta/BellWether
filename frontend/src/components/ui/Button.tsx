import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'soft' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-hibiscus disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-full gap-1.5',
    md: 'px-6 py-3 text-base rounded-full gap-2',
    lg: 'px-8 py-4 text-lg rounded-full gap-2.5 font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-persimmon text-paper hover:bg-gradient-to-r hover:from-coral hover:to-vermilion shadow-oxblood-sm hover:shadow-oxblood-md active:scale-98',
    soft: 'bg-blush text-oxblood hover:bg-apricot/40 active:scale-98',
    ghost: 'bg-transparent text-oxblood hover:bg-blush/50 active:scale-98',
    outline: 'border-2 border-persimmon text-persimmon hover:bg-persimmon hover:text-paper active:scale-98',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
