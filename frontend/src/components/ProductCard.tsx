import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatCurrency } from '../lib/brand';
import { ArchFrame } from './ui/ArchFrame';
import { Chip } from './ui/Chip';
import { useCompleteLook } from '../hooks/useApi';

export interface ProductCardProps {
  product: Product;
  personaName?: string;
  onClick?: () => void;
}

function colorDot(color: string): string {
  const c = color.toLowerCase();
  if (c.includes('red') || c.includes('vermilion') || c.includes('persimmon') || c.includes('rust')) return '#F4552F';
  if (c.includes('pink') || c.includes('hibiscus')) return '#E8336F';
  if (c.includes('peach') || c.includes('apricot') || c.includes('brass') || c.includes('marigold') || c.includes('mustard')) return '#FFB690';
  return '#4B0F1B';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, personaName, onClick }) => {
  const isLowStock = product.stock <= 5;
  const [showLook, setShowLook] = useState(false);
  const lookQuery = useCompleteLook(product.id, showLook);

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
          imgClassName="photo-warm"
          wrapClassName="photo-warm-wrap"
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
              <span className="w-2.5 h-2.5 rounded-full border border-oxblood/20 shadow-xs" style={{ backgroundColor: colorDot(product.color) }} />
              <span>{product.color}</span>
            </div>
          </div>

          <h3 className="font-serif text-lg font-semibold text-oxblood group-hover:text-persimmon transition-colors line-clamp-1">
            {product.name}
          </h3>

          {product.boosted && personaName && (
            <span className="inline-block text-[11px] font-mono bg-hibiscus/10 text-hibiscus px-2 py-0.5 rounded-full">
              Picked for {personaName}
            </span>
          )}

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
              <span>Match</span>
              <span className="font-semibold text-persimmon">{Math.round(Math.min(product.score, 1) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-blush rounded-full overflow-hidden">
              <div
                className="h-full bg-persimmon rounded-full"
                style={{ width: `${Math.round(Math.min(product.score, 1) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Why-this-matches caption if available */}
        {product.match_reason && (
          <p className="text-[11px] italic text-hibiscus bg-hibiscus/10 px-2.5 py-1.5 rounded-xl leading-tight">
            {product.match_reason}
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-serif text-xl font-bold text-oxblood tabular-nums">
            {formatCurrency(product.price)}
          </span>
          <Chip label="View Details" variant="persimmon" />
        </div>

        {/* Complete the look */}
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowLook((v) => !v); }}
            className="flex items-center gap-1.5 text-xs font-medium text-oxblood/70 hover:text-oxblood transition-colors cursor-pointer"
            aria-expanded={showLook}
          >
            {showLook ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Complete the look
          </button>
          {showLook && (
            <div className="pt-2 space-y-2">
              {lookQuery.isPending && (
                <p className="text-xs text-oxblood/60 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding pairs…
                </p>
              )}
              {lookQuery.data?.results.map((item: Product) => (
                <div key={item.id} className="flex items-center gap-2.5 bg-blush/30 rounded-2xl p-2">
                  <div className="arch-sm overflow-hidden w-10 h-10 shrink-0 bg-blush photo-warm-wrap">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover photo-warm" loading="lazy" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-oxblood truncate">{item.name}</p>
                    <p className="text-[11px] text-oxblood/60 truncate">{item.reason ?? formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
              {lookQuery.data && lookQuery.data.results.length === 0 && !lookQuery.isPending && (
                <p className="text-xs text-oxblood/60">No frequent pairs found yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
