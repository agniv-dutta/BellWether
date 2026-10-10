import React from 'react';

export interface SkeletonProps {
  className?: string;
  arch?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', arch = false }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-blush via-paper to-blush bg-[length:200%_100%] ${
        arch ? 'arch' : 'rounded-2xl'
      } ${className}`}
    />
  );
};
