/**
 * Single source of truth for product identity and copy.
 * Never type the product name inline in components — import from here.
 */

export const BRAND = {
  name: 'BellWether',
  tagline: "Hear what shoppers want. Stock what they'll buy.",
  descriptor: 'Closed-loop retail intelligence',
  subline:
    'BellWether turns every search, photo and chat into a signal your store can act on.',
  concept: 'The Shopfront',
  aiLabel: 'Gemini',
  statusOnline: 'Gemini online',
  statusOffline: 'Demo data',
} as const;

export const CATEGORIES = [
  'Apparel',
  'Footwear',
  'Home & Living',
  'Beauty',
  'Kitchen',
  'Accessories',
] as const;

export const PERSONAS = [
  { id: '', name: 'Everyone', tag: 'no personalisation' },
  { id: 'aarav', name: 'Aarav', tag: 'streetwear' },
  { id: 'meera', name: 'Meera', tag: 'minimal home' },
  { id: 'riya', name: 'Riya', tag: 'budget-first' },
] as const;

export const MARQUEE_PHRASES = [
  'a sneaker that goes with everything',
  'linen shirt, relaxed fit',
  'a lamp for a small reading corner',
  'gift for someone who loves cooking',
  'something for a quiet weekend',
  'a throw for the reading chair',
  'skincare for dry winter air',
] as const;

/** The only way to render money. INR, no decimals. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact lakh/crore formatting for KPIs, e.g. 29,69,321 -> "₹29.7L". */
export function formatCompactINR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return formatCurrency(value);
}
