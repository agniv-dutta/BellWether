import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, Search, X, Image as ImageIcon, Loader2, AlertTriangle, Frown, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ProductCard } from '../components/ProductCard';
import { ChatDrawer } from '../components/ChatDrawer';
import { useSearchProducts, useVisualSearch } from '../hooks/useApi';
import type { Product } from '../lib/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export const ShopperStudio: React.FC = () => {
  const prefersReduced = useReducedMotion();

  // Visual search state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Visual search mutation
  const visualSearch = useVisualSearch();

  // Text search query
  const { data: searchData, isLoading: isSearching, isError: searchError, refetch: retrySearch } = useSearchProducts(
    activeQuery,
    selectedCategory,
    maxPrice
  );

  const categories = ['Apparel', 'Accessories', 'Jewellery', 'Home & Craft', 'Dining', 'Decor'];

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setHint('');
    visualSearch.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVisualSearch = () => {
    if (!uploadedFile) return;
    visualSearch.mutate({ image: uploadedFile, hint: hint || undefined });
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  // Determine which results to show
  const visualResults = visualSearch.data?.results;
  const textResults = searchData?.results;
  const results = visualResults || textResults;
  const isLoading = visualSearch.isPending || isSearching;
  const hasError = visualSearch.isError || searchError;
  const hasResults = results && results.length > 0;
  const showEmpty = !isLoading && !hasError && activeQuery && (!results || results.length === 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="mesh-soft grain px-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Shopper Studio"
            title="Find exactly what you're looking for."
            subtitle="Upload a photo, describe a feeling, or just start typing. We'll understand."
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[380px_1fr] gap-10">
          {/* =========== LEFT PANEL: INPUT =========== */}
          <div className="space-y-8">
            {/* Visual Search Drop Zone */}
            <Card variant="paper" className="space-y-4 p-6">
              <h3 className="font-serif text-xl text-oxblood flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-hibiscus" />
                Visual Search
              </h3>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative arch overflow-hidden aspect-[3/4] border-2 border-dashed transition-all duration-300 cursor-pointer flex items-center justify-center ${
                  isDragOver
                    ? 'border-persimmon bg-persimmon/5 scale-[1.02]'
                    : previewUrl
                    ? 'border-apricot/60 bg-blush/30'
                    : 'border-apricot/40 bg-blush/20 hover:border-persimmon/50 hover:bg-blush/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload image for visual search"
                />

                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Uploaded search image" className="w-full h-full object-cover" />
                    {/* Loupe Ring Animation during search */}
                    {visualSearch.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-oxblood/30">
                        <motion.div
                          animate={prefersReduced ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-32 h-32 rounded-full border-4 border-persimmon bg-persimmon/20 flex items-center justify-center"
                        >
                          <Search className="w-10 h-10 text-paper" />
                        </motion.div>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-oxblood/70 text-paper rounded-full flex items-center justify-center hover:bg-oxblood transition-colors"
                      aria-label="Remove uploaded image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-3 p-6">
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-apricot/50 bg-blush/40 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-persimmon/80" />
                    </div>
                    <p className="text-sm text-oxblood/80 font-medium">
                      Drop an image here
                    </p>
                    <p className="text-xs text-oxblood/50">
                      or tap to upload or use camera
                    </p>
                  </div>
                )}
              </div>

              {/* Hint + Find Button */}
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Optional: describe what to look for..."
                    className="w-full px-4 py-2.5 bg-blush/40 border border-apricot/40 rounded-2xl text-sm text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                  />
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleVisualSearch}
                    disabled={visualSearch.isPending}
                  >
                    {visualSearch.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analysing…
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" /> Find it
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Extracted Attributes */}
              <AnimatePresence>
                {visualSearch.data?.attributes && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3 pt-2"
                  >
                    <p className="text-xs font-mono text-oxblood/60 uppercase tracking-wider">What we understood</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip label={visualSearch.data.attributes.category} variant="hibiscus" />
                      <Chip label={visualSearch.data.attributes.color} variant="apricot" />
                      <Chip label={visualSearch.data.attributes.occasion} variant="persimmon" />
                      {visualSearch.data.attributes.style.map((s: string) => (
                        <Chip key={s} label={s} variant="blush" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Text Search */}
            <Card variant="blush" className="space-y-4 p-6">
              <h3 className="font-serif text-xl text-oxblood flex items-center gap-2">
                <Search className="w-5 h-5 text-hibiscus" />
                Search by words
              </h3>

              <form onSubmit={handleTextSearch} className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="A saree the colour of monsoon dusk…"
                  className="w-full px-4 py-3 bg-paper border border-apricot/40 rounded-2xl text-sm text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                />

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      variant="blush"
                      selected={selectedCategory === cat}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                    />
                  ))}
                </div>

                {/* Price Filter */}
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-oxblood/60 font-mono whitespace-nowrap">Max ₹</span>
                  <input
                    type="number"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="flex-1 px-3 py-2 bg-paper border border-apricot/40 rounded-xl text-sm text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                  />
                </div>

                <Button variant="primary" className="w-full" type="submit">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </form>
            </Card>
          </div>

          {/* =========== RIGHT PANEL: RESULTS =========== */}
          <div className="space-y-6">
            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3 p-4 bg-paper border border-blush rounded-3xl">
                    <Skeleton arch className="aspect-[4/5] w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <Card variant="paper" className="text-center py-16 space-y-4">
                <AlertTriangle className="w-12 h-12 text-vermilion mx-auto" />
                <h3 className="font-serif text-2xl text-oxblood">Something went sideways</h3>
                <p className="text-oxblood/70 text-sm">We couldn't complete the search. This might be a network hiccup.</p>
                <Button
                  variant="soft"
                  onClick={() => {
                    if (visualSearch.isError) clearUpload();
                    else retrySearch();
                  }}
                >
                  <RefreshCw className="w-4 h-4" /> Try again
                </Button>
              </Card>
            )}

            {/* Empty State */}
            {showEmpty && (
              <Card variant="paper" className="text-center py-16 space-y-4">
                <Frown className="w-12 h-12 text-apricot mx-auto" />
                <h3 className="font-serif text-2xl text-oxblood">Nothing yet</h3>
                <p className="text-oxblood/70 text-sm max-w-md mx-auto">
                  Try describing the vibe — "earthy warm tones" or "evening occasion" — 
                  instead of exact product names.
                </p>
              </Card>
            )}

            {/* Results Grid */}
            {hasResults && !isLoading && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {results!.map((product: Product) => (
                  <motion.div
                    key={product.id}
                    variants={fadeInUp}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Initial welcome state */}
            {!isLoading && !hasError && !activeQuery && !visualResults && (
              <Card variant="mesh" className="text-center py-20 space-y-5">
                <div className="w-20 h-20 mx-auto arch bg-blush/80 border border-apricot/40 flex items-center justify-center">
                  <Search className="w-8 h-8 text-persimmon/70" />
                </div>
                <h3 className="font-serif text-3xl text-oxblood">Your discoveries await</h3>
                <p className="text-oxblood/70 text-sm max-w-md mx-auto">
                  Upload a photo of something you love, or type what you're looking
                  for. We'll find the closest match.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <ChatDrawer />
    </div>
  );
};
