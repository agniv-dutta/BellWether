import React from 'react';

export interface ChipProps {
  label: string;
  variant?: 'blush' | 'apricot' | 'hibiscus' | 'persimmon' | 'oxblood';
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'blush',
  selected = false,
  onClick,
  icon,
  onRemove
}) => {
  const variantStyles = {
    blush: selected ? 'bg-hibiscus text-paper' : 'bg-blush text-oxblood hover:bg-apricot/40',
    apricot: selected ? 'bg-persimmon text-paper' : 'bg-apricot/30 text-oxblood hover:bg-apricot/60',
    hibiscus: selected ? 'bg-oxblood text-paper' : 'bg-hibiscus/20 text-hibiscus hover:bg-hibiscus/30',
    persimmon: selected ? 'bg-oxblood text-paper' : 'bg-persimmon/15 text-persimmon hover:bg-persimmon/25',
    oxblood: selected ? 'bg-persimmon text-paper' : 'bg-oxblood/10 text-oxblood hover:bg-oxblood/20',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
        onClick ? 'cursor-pointer active:scale-95 select-none' : ''
      } ${variantStyles[variant]}`}
    >
      {icon && <span className="text-current">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-75 focus:outline-none"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};
