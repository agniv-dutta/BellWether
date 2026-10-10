import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Sparkles, ShoppingBag, Store, BookOpen, ShieldCheck, RefreshCw } from 'lucide-react';
import { getMockMode, setMockMode } from '../lib/api';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isMock, setIsMock] = useState(getMockMode());

  const handleMockToggle = () => {
    const nextMode = !isMock;
    setMockMode(nextMode);
    setIsMock(nextMode);
    window.location.reload();
  };

  const navLinks = [
    { path: '/', label: 'Overview', icon: Sparkles },
    { path: '/problem', label: 'Problem & Story', icon: BookOpen },
    { path: '/shop', label: 'Shopper Studio', icon: ShoppingBag },
    { path: '/merchant', label: 'Merchant Desk', icon: Store },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-oxblood grain relative selection:bg-apricot selection:text-oxblood">
      {/* Floating Pill Navbar */}
      <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto bg-paper/90 backdrop-blur-md border border-apricot/40 shadow-oxblood-lg rounded-full px-4 py-2.5 flex items-center gap-2 sm:gap-6 max-w-4xl w-full justify-between transition-all duration-300">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pl-2 group">
            <span className="w-8 h-8 rounded-full bg-persimmon text-paper flex items-center justify-center font-serif text-lg font-bold shadow-sm group-hover:bg-hibiscus transition-colors">
              B
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-oxblood leading-none">
                BellWether
              </span>
              <span className="font-mono text-[10px] text-hibiscus tracking-wider">
                JAUHARI AI
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-persimmon text-paper shadow-oxblood-sm font-semibold'
                      : 'text-oxblood/80 hover:text-oxblood hover:bg-blush/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-paper' : 'text-hibiscus'}`} />
                  <span className="hidden md:inline">{link.label}</span>
                  <span className="md:hidden">{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Mock Mode Indicator */}
          <button
            onClick={handleMockToggle}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all border ${
              isMock
                ? 'bg-blush text-oxblood border-apricot'
                : 'bg-hibiscus/10 text-hibiscus border-hibiscus/30'
            }`}
            title="Toggle Demo Mock Mode vs Live Backend"
          >
            <span className={`w-2 h-2 rounded-full ${isMock ? 'bg-persimmon' : 'bg-hibiscus'}`} />
            <span>{isMock ? 'Mocks Active' : 'Live API'}</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-apricot/30 bg-blush/40 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-serif text-2xl font-bold text-oxblood">BellWether</span>
              <span className="font-mono text-xs text-hibiscus bg-hibiscus/10 px-2 py-0.5 rounded-full">
                The Jeweller's Table
              </span>
            </div>
            <p className="text-sm text-oxblood/75 max-w-md">
              Intelligent Consumer & Operational Interactions for retail. Built for Google AI Builder Cup 2026.
            </p>
          </div>

          {/* Demo Mode Toggle Button */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-3 bg-paper border border-apricot/50 px-4 py-2 rounded-2xl shadow-oxblood-sm">
              <div className="text-xs">
                <span className="font-semibold block text-oxblood">Demo Data Mode</span>
                <span className="text-[11px] text-oxblood/70">
                  {isMock ? 'Simulated instant responses (Offline-safe)' : 'Connected to FastAPI VITE_API_URL'}
                </span>
              </div>
              <button
                onClick={handleMockToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-persimmon text-paper hover:bg-coral transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isMock ? 'Switch to Live API' : 'Switch to Mocks'}</span>
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
