import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, RefreshCw } from 'lucide-react';
import { getMockMode, setMockMode } from '../lib/api';
import { BRAND } from '../lib/brand';
import { useHealth } from '../hooks/useApi';

const NAV_LINKS = [
  { path: '/problem', label: 'Story' },
  { path: '/shop', label: 'Shop' },
  { path: '/merchant', label: 'Merchant' },
];

function StatusDot({ dark }: { dark: boolean }) {
  const { data } = useHealth();
  const online = !!data && data.status === 'ok';
  const health = data as { model?: string; latency_ms?: number | null } | undefined;
  const tooltip = online
    ? `${BRAND.aiLabel} ${health?.model ?? ''}${health?.latency_ms != null ? ` · ${Math.round(health.latency_ms)}ms` : ''}`.trim()
    : BRAND.statusOffline;
  return (
    <span
      className={`hidden sm:flex items-center gap-2 text-xs font-mono ${
        dark ? 'text-paper/80' : 'text-oxblood/70'
      }`}
      title={tooltip}
    >
      {online ? (
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-persimmon opacity-60 animate-ping" />
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-persimmon" />
        </span>
      ) : (
        <span className="w-2.5 h-2.5 rounded-full border-2 border-vermilion" />
      )}
      <span className="hidden lg:inline">{online ? BRAND.statusOnline : BRAND.statusOffline}</span>
    </span>
  );
}

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isMock, setIsMock] = useState(getMockMode());
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) firstLinkRef.current?.focus();
    else menuButtonRef.current?.focus();
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleMockToggle = () => {
    const nextMode = !isMock;
    setMockMode(nextMode);
    setIsMock(nextMode);
    window.location.reload();
  };

  const onSheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setMenuOpen(false);
  };

  const dark = location.pathname.startsWith('/merchant') && !scrolled;
  const linkTone = dark ? 'text-paper/85 hover:text-paper' : 'text-oxblood/80 hover:text-oxblood';

  return (
    <div className="min-h-screen flex flex-col bg-paper text-oxblood grain relative selection:bg-apricot selection:text-oxblood">
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-150 ${
          scrolled ? 'bg-paper/80 backdrop-blur-md border-b border-oxblood/10' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between" aria-label="Primary">
          {/* Logo: mark + single wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label={`${BRAND.name} home`}>
            <span className="arch w-7 h-9 bg-persimmon flex items-end justify-center pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-paper" />
            </span>
            <span className={`font-serif text-xl font-bold tracking-tight leading-none ${dark ? 'text-paper' : 'text-oxblood'}`}>
              {BRAND.name}
            </span>
          </Link>

          {/* Centre links (desktop) */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-[15px] font-medium whitespace-nowrap transition-colors ${linkTone} ${
                    isActive ? (dark ? 'text-paper' : 'text-oxblood') : ''
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-2 h-[2px] bg-persimmon rounded-full"
                      style={{ bottom: '-8px' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: status + CTA */}
          <div className="hidden md:flex items-center gap-5">
            <StatusDot dark={dark} />
            <Link
              to="/shop"
              className="text-sm font-semibold bg-persimmon text-paper px-5 py-2.5 rounded-full hover:bg-coral transition-colors"
            >
              Try the demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            className={`md:hidden w-10 h-10 flex items-center justify-center rounded-full ${dark ? 'text-paper' : 'text-oxblood'}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile sheet */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden bg-paper/95 backdrop-blur-md border-b border-oxblood/10 px-6 py-6"
              onKeyDown={onSheetKeyDown}
            >
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link, i) => (
                  <Link
                    key={link.path}
                    ref={i === 0 ? firstLinkRef : undefined}
                    to={link.path}
                    onClick={closeMenu}
                    className="font-serif text-3xl text-oxblood py-2 hover:text-persimmon transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/shop"
                  onClick={closeMenu}
                  className="mt-4 text-center font-semibold bg-persimmon text-paper px-5 py-3 rounded-full hover:bg-coral transition-colors"
                >
                  Try the demo
                </Link>
                <div className="mt-2 flex justify-center">
                  <StatusDot dark={false} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-[68px] pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-apricot/30 bg-blush/40 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-serif text-2xl font-bold text-oxblood">{BRAND.name}</span>
              <span className="font-mono text-xs text-hibiscus bg-hibiscus/10 px-2 py-0.5 rounded-full">
                {BRAND.concept}
              </span>
            </div>
            <p className="text-sm text-oxblood/75 max-w-md">
              {BRAND.descriptor} for retail. Built for Google AI Builder Cup 2026.
            </p>
          </div>

          {/* Demo Mode Toggle Button */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-3 bg-paper border border-apricot/50 px-4 py-2 rounded-2xl shadow-oxblood-sm">
              <div className="text-xs">
                <span className="font-semibold block text-oxblood">Demo Data Mode</span>
                <span className="text-[11px] text-oxblood/70">
                  {isMock ? 'Simulated instant responses (Offline-safe)' : 'Live data from the Gemini API'}
                </span>
              </div>
              <button
                onClick={handleMockToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-persimmon text-paper hover:bg-coral transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isMock ? 'Switch to Gemini' : 'Switch to demo data'}</span>
              </button>
            </div>
            <span className="text-[11px] font-mono text-oxblood/60">
              No raw hex • No blue/purple • All components hand-built
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
