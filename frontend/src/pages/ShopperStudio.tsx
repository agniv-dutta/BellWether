import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { Upload, Search, X, Image as ImageIcon, Loader2, AlertTriangle, RefreshCw, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Toast } from '../components/ui/Toast';
import { ProductCard } from '../components/ProductCard';
import { ChatDrawer, type ChatDrawerHandle } from '../components/ChatDrawer';
import { useSearchProducts, useVisualSearch, useTrending } from '../hooks/useApi';
import { CATEGORIES, PERSONAS, formatCurrency } from '../lib/brand';
import type { Product } from '../lib/types';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

type Mode = 'describe' | 'photo' | 'ask';

export const ShopperStudio: React.FC = () => {
  const prefersReduced = useReducedMotion();

  const [mode, setMode] = useState<Mode>('describe');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [personaId, setPersonaId] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedQuery, setDismissedQuery] = useState('');
  const chatHandle = useRef<ChatDrawerHandle | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visualSearch = useVisualSearch();

  const { data: searchData, isLoading: isSearching, isError: searchError, refetch: retrySearch } = useSearchProducts(
    activeQuery,
    selectedCategory,
    maxPrice,
    personaId
  );

  const showTrending = !activeQuery && !visualSearch.data;
  const trending = useTrending(showTrending);

  const personaName = PERSONAS.find((p) => p.id === personaId)?.name ?? '';

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const dismissToast = () => {
    setToast(null);
    setDismissedQuery(activeQuery);
  };

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

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  const handleVisualSearch = () => {
    if (!uploadedFile) return;
    visualSearch.mutate(
      { image: uploadedFile, hint: hint || undefined, personaId },
      {
        onError: () => setToast('Photo search stumbled. Try again?'),
      }
    );
  };

  const handleAskTab = () => {
    chatHandle.current?.openAndFocus();
  };

  const visualResults = visualSearch.data?.results;
  const textResults = searchData?.results;
  const trendingResults = showTrending ? trending.data?.results : undefined;
  const results = visualResults || textResults || trendingResults;
  const isLoading = visualSearch.isPending || isSearching || (showTrending && trending.isPending);
  const hasError = visualSearch.isError || searchError || (showTrending && trending.isError);
  const hasResults = results && results.length > 0;
  const showEmpty =
    !isLoading && !hasError && !showTrending &&
    (activeQuery || visualResults) && (!results || results.length === 0);

  // Derived, not state: a miss toast shows until dismissed for that query.
  // (The backend already logged the miss for Demand Radar.)
  const missToastVisible =
    showEmpty && !!activeQuery && dismissedQuery !== activeQuery;

  return (
    <div className="min-h-screen">
      {/* Compact header */}
      <section className="mesh-soft grain px-6 pt-10 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-hibiscus">Shopper Studio</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-oxblood mt-1">What are you looking for today?</h1>
          </div>
          <label className="flex items-center gap-2 text-sm text-oxblood/70">
            <span className="font-mono text-xs">Shopping as</span>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="px-3 py-2 bg-paper border border-apricot/40 rounded-xl text-sm text-oxblood focus:outline-none focus:ring-2 focus:ring-hibiscus/30 cursor-pointer"
              aria-label="Choose a shopping persona"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.tag}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Command bar */}
        <Card variant="paper" className="p-4 sm:p-5 mb-8">
          <div className="flex gap-2 mb-4" role="tablist" aria-label="Search mode">
            {(['describe', 'photo', 'ask'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => (m === 'ask' ? (setMode(m), handleAskTab()) : setMode(m))}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer ${
                  mode === m ? 'bg-persimmon text-paper' : 'bg-blush/50 text-oxblood/70 hover:bg-blush'
                }`}
              >
                {m === 'describe' ? 'Describe' : m === 'photo' ? 'Photo' : 'Ask'}
              </button>
            ))}
          </div>

          {mode === 'describe' && (
            <form onSubmit={handleTextSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-oxblood/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="A lamp for a small reading corner…"
                  className="w-full pl-11 pr-4 py-3.5 bg-blush/30 border border-apricot/40 rounded-2xl text-base text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                  aria-label="Describe what you're looking for"
                />
              </div>
              <Button variant="primary" type="submit" disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
          )}

          {mode === 'photo' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative arch overflow-hidden border-2 border-dashed transition-all cursor-pointer flex items-center justify-center min-h-44 ${
                  isDragOver ? 'border-persimmon bg-persimmon/5' : 'border-apricot/40 bg-blush/20 hover:border-persimmon/50'
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
                    <img src={previewUrl} alt="Uploaded search image" className="w-full max-h-64 object-cover" />
                    {visualSearch.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-oxblood/30">
                        <motion.div
                          animate={prefersReduced ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-24 h-24 rounded-full border-4 border-persimmon bg-persimmon/20 flex items-center justify-center"
                        >
                          <Search className="w-8 h-8 text-paper" />
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
                  <div className="text-center space-y-2 p-6">
                    <div className="w-14 h-14 mx-auto rounded-full border-2 border-apricot/50 bg-blush/40 flex items-center justify-center">
                      {isDragOver ? <ImageIcon className="w-6 h-6 text-persimmon/80" /> : <Upload className="w-6 h-6 text-persimmon/80" />}
                    </div>
                    <p className="text-sm text-oxblood/80 font-medium">Drop a photo here, or tap to use your camera</p>
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Optional: describe what to look for…"
                    className="flex-1 px-4 py-2.5 bg-blush/40 border border-apricot/40 rounded-2xl text-sm text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                  />
                  <Button variant="primary" onClick={handleVisualSearch} disabled={visualSearch.isPending}>
                    {visualSearch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find it'}
                  </Button>
                </div>
              )}
              <AnimatePresence>
                {visualSearch.data?.attributes && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
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
            </div>
          )}

          {mode === 'ask' && (
            <div className="flex items-center gap-3 bg-blush/30 border border-apricot/30 rounded-2xl px-5 py-4">
              <MessageCircle className="w-5 h-5 text-hibiscus shrink-0" />
              <p className="text-sm text-oxblood/80">
                Tell me in your own words — the chat is open and listening.
              </p>
              <Button variant="soft" className="ml-auto shrink-0" onClick={handleAskTab}>
                Focus chat
              </Button>
            </div>
          )}

          {/* Category pills + price */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-blush/60">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                variant="blush"
                selected={selectedCategory === cat}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat ? '' : cat);
                }}
              />
            ))}
            <label className="flex items-center gap-2 ml-auto text-xs text-oxblood/60 font-mono whitespace-nowrap">
              Max {maxPrice ? formatCurrency(maxPrice) : 'any'}
              <input
                type="range"
                min={299}
                max={6999}
                step={100}
                value={maxPrice ?? 6999}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxPrice(v >= 6999 ? undefined : v);
                }}
                className="w-32 accent-persimmon"
                aria-label="Maximum price in rupees"
              />
            </label>
          </div>
        </Card>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Left filter rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card variant="blush" className="p-5 space-y-3">
                <h3 className="font-serif text-lg text-oxblood">Good to know</h3>
                <p className="text-xs text-oxblood/70 leading-relaxed">
                  Every search teaches the store something. If we can't find it, the merchants hear about it.
                </p>
              </Card>
              <Card variant="paper" className="p-5 space-y-2">
                <h3 className="font-serif text-lg text-oxblood">Price</h3>
                <p className="text-xs font-mono text-oxblood/70">
                  {maxPrice ? `Up to ${formatCurrency(maxPrice)}` : 'No limit'}
                </p>
                <input
                  type="range"
                  min={299}
                  max={6999}
                  step={100}
                  value={maxPrice ?? 6999}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxPrice(v >= 6999 ? undefined : v);
                  }}
                  className="w-full accent-persimmon"
                  aria-label="Maximum price in rupees"
                />
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="text-xs text-hibiscus hover:text-vermilion font-medium cursor-pointer"
                  >
                    Clear {selectedCategory} filter
                  </button>
                )}
              </Card>
            </div>
          </aside>

          {/* Results */}
          <div className="space-y-6 min-w-0">
            {showTrending && (
              <h2 className="font-serif text-2xl text-oxblood flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-persimmon" />
                Trending today
              </h2>
            )}

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

            {showEmpty && (
              <Card variant="paper" className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto arch bg-blush/60 border border-apricot/40 flex items-center justify-center">
                  <Search className="w-7 h-7 text-persimmon/70" />
                </div>
                <h3 className="font-serif text-2xl text-oxblood">Not on our shelves — yet</h3>
                <p className="text-oxblood/70 text-sm max-w-md mx-auto">
                  We couldn't find that yet, and we've told the store. Try describing the vibe —
                  "earthy warm tones" or "evening occasion" — instead of exact names.
                </p>
              </Card>
            )}
            {hasResults && !isLoading && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {results!.map((product: Product) => (
                  <motion.div key={product.id} variants={fadeInUp}>
                    <ProductCard product={product} personaName={personaName} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {(toast || missToastVisible) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,480px)]">
          <Toast
            message={toast ?? "We couldn't find that yet, and we've told the store."}
            type="info"
            onClose={dismissToast}
          />
        </div>
      )}

      <ChatDrawer personaId={personaId} handleRef={chatHandle} />
    </div>
  );
};
