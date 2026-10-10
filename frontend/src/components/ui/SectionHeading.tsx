import React from 'react';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  dark?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
  dark = false,
}) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  return (
    <div className={`space-y-3 max-w-3xl ${alignmentClasses[align]} ${className}`}>
      {eyebrow && (
        <span className={`inline-block font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full ${
          dark ? 'bg-paper/10 text-apricot' : 'bg-blush/80 text-hibiscus'
        }`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] ${
        dark ? 'text-paper' : 'text-oxblood'
      }`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base sm:text-lg leading-relaxed ${
          dark ? 'text-paper/80' : 'text-oxblood/80'
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
