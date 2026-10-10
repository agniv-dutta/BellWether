import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 mesh-soft grain">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        className="text-center space-y-6 max-w-md"
      >
        <span className="text-display text-8xl sm:text-9xl text-apricot/60">404</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-oxblood">
          This shelf is empty.
        </h1>
        <p className="text-oxblood/70 text-base leading-relaxed">
          We looked everywhere, but this page doesn't seem to exist.
          Maybe it wandered off to find a better colour palette.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            <ArrowLeft className="w-5 h-5" />
            Back to the warmth
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};
