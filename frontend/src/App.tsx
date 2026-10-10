import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { ProblemStory } from './pages/ProblemStory';
import { ShopperStudio } from './pages/ShopperStudio';
import { MerchantDesk } from './pages/MerchantDesk';
import { NotFound } from './pages/NotFound';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<motion.div {...pageTransition}><Landing /></motion.div>} />
          <Route path="problem" element={<motion.div {...pageTransition}><ProblemStory /></motion.div>} />
          <Route path="shop" element={<motion.div {...pageTransition}><ShopperStudio /></motion.div>} />
          <Route path="merchant" element={<motion.div {...pageTransition}><MerchantDesk /></motion.div>} />
          <Route path="*" element={<motion.div {...pageTransition}><NotFound /></motion.div>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
