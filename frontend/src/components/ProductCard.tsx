import React from 'react';
import { Product } from '../lib/types';
import { ArchFrame } from './ui/ArchFrame';
import { Chip } from './ui/Chip';

export interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const isLowStock = product.stock <= 5;

  return (
    <div
      onClick={onClick}
      className="group bg-paper/60 hover:bg-blush/40 border border-blush/80 rounded-3xl p-4 transition-all duration-300 hover:shadow-oxblood-md flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Arch Image Frame */}
        <ArchFrame
          src={product.image_url}
          alt={product.name}
          aspectRatio="aspect-[4/5]"
          badge={
            isLowStock ? (
              <span className="bg-vermilion text-paper text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                Only {product.stock} left
              </span>
            ) : undefined
          }
        />

        {/* Product Details */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-oxblood/70 font-mono">
            <span>{product.category}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-oxblood/20 shadow-xs" style={{ backgroundColor: product.color.toLowerCase().includes('red') || product.color.toLowerCase().includes('vermilion') || product.color.toLowerCase().includes('persimmon') ? '#F4552F' : product.color.toLowerCase().includes('pink') || product.color.toLowerCase().includes('hibiscus') ? '#E8336F' : product.color.toLowerCase().includes('peach') || product.color.toLowerCase().includes('apricot') ? '#FFB690' : '#4B0F1B' }} />
              <span>{product.color}</span>
            </div>
          </div>

          <h3 className="font-serif text-lg font-semibold text-oxblood group-hover:text-persimmon transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-oxblood/75 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-3 mt-2 border-t border-blush/60">
        {/* Match score bar if available */}
        {product.score !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] font-mono text-oxblood/80">
              <span>Match Confidence</span>
              <span className="font-semibold text-persimmon">{Math.round(product.score * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-blush rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-apricot to-persimmon rounded-full"
                style={{ width: `${Math.round(product.score * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Reason caption if available */}
        {product.match_reason && (
          <p className="text-[11px] italic text-hibiscus bg-hibiscus/10 px-2.5 py-1.5 rounded-xl leading-tight">
            💡 {product.match_reason}
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-serif text-xl font-bold text-oxblood">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <Chip label="View Details" variant="persimmon" />
        </div>
      </div>
    </div>
  );
};
