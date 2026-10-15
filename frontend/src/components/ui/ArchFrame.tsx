import React from 'react';

export interface ArchFrameProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  imgClassName?: string;
  wrapClassName?: string;
}

export const ArchFrame: React.FC<ArchFrameProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  badge,
  children,
  imgClassName = '',
  wrapClassName = ''
}) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Outer subtle apricot ring */}
      <div className="absolute -inset-1.5 rounded-[999px_999px_32px_32px] bg-gradient-to-b from-apricot/40 via-coral/30 to-hibiscus/20 opacity-80 group-hover:opacity-100 group-hover:scale-[1.01] transition-all duration-300 pointer-events-none" />

      {/* Arch Image Container */}
      <div className={`relative overflow-hidden arch ${aspectRatio} bg-blush shadow-oxblood-md w-full h-full ${wrapClassName}`}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imgClassName}`}
        />
        {/* Subtle inner gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-oxblood/40 via-transparent to-transparent opacity-30 group-hover:opacity-20 transition-opacity duration-300" />
        
        {badge && (
          <div className="absolute top-4 right-4 z-10">
            {badge}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
