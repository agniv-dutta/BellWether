import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import { ShoppingBag, Store, Search, Camera, MessageCircle, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Marquee } from '../components/ui/Marquee';
import { BRAND, MARQUEE_PHRASES } from '../lib/brand';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const marqueeItems = [...MARQUEE_PHRASES];

const heroArches = [
  {
    src: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
    alt: 'Relaxed apparel on a rail',
    height: 'h-[360px]',
    yOff: 0,
  },
  {
    src: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
    alt: 'Warm home light',
    height: 'h-[420px]',
    yOff: -36,
  },
  {
    src: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80',
    alt: 'Everyday carry accessories',
    height: 'h-[340px]',
    yOff: -12,
  },
];

const loopNodes = [
  { title: 'Shopper asks', desc: 'A photo, a few words, a feeling — even for things you don\u2019t stock.' },
  { title: 'BellWether listens', desc: 'Every search and chat becomes a signal, misses included.' },
  { title: 'Merchant decides', desc: 'Demand Radar turns misses into restocking actions.' },
  { title: 'Shelf gets better', desc: 'What shoppers wanted shows up on the shelves.' },
];

export const Landing: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReduced) return;
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [prefersReduced]);

  return (
    <div className="overflow-hidden">
      {/* =========== HERO =========== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center mesh-hero grain">
        <motion.div
          style={{ y: prefersReduced ? 0 : heroY }}
          className="w-full max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left: Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6 lg:space-y-8 relative z-10"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-hibiscus bg-hibiscus/10 px-4 py-1.5 rounded-full border border-hibiscus/20"
            >
              {BRAND.name} · {BRAND.descriptor}
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="font-serif text-oxblood leading-[1.02]"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', letterSpacing: '-0.02em' }}
            >
              {BRAND.tagline}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-oxblood/80 max-w-lg leading-relaxed"
            >
              {BRAND.subline}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 pt-2">
              <Link to="/shop">
                <Button variant="primary" size="lg">
                  <ShoppingBag className="w-5 h-5" />
                  Start shopping
                </Button>
              </Link>
              <Link to="/merchant">
                <Button variant="outline" size="lg">
                  <Store className="w-5 h-5" />
                  I run a store
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Arch Images + signal card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative hidden lg:flex items-end justify-center gap-5 min-h-[480px]"
            style={
              prefersReduced
                ? {}
                : { x: mousePos.x * 0.008, y: mousePos.y * 0.008 }
            }
          >
            {heroArches.map((arch, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className={`relative ${arch.height} w-[160px] flex-shrink-0`}
              >
                <div className="absolute -inset-1.5 rounded-[999px_999px_28px_28px] bg-gradient-to-b from-apricot/50 to-coral/30" />
                <div className="relative arch overflow-hidden h-full w-full shadow-oxblood-md bg-blush photo-warm-wrap">
                  <img
                    src={arch.src}
                    alt={arch.alt}
                    className="w-full h-full object-cover photo-warm"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oxblood/30 via-transparent to-transparent" />
                </div>
              </motion.div>
            ))}

            {/* Floating signal card */}
            <motion.div
              variants={fadeInUp}
              className="absolute -bottom-2 left-2 z-20 bg-paper border border-apricot/50 rounded-2xl shadow-oxblood-md px-4 py-3 w-64"
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-hibiscus flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Rising now
              </p>
              <p className="font-serif text-base text-oxblood leading-snug mt-1">
                Linen co-ord sets, up 38% this week — 0 in stock
              </p>
              <svg viewBox="0 0 120 28" className="w-full h-7 mt-1" aria-hidden="true">
                <polyline
                  points="0,24 15,22 30,23 45,18 60,19 75,12 90,13 105,6 120,4"
                  fill="none"
                  stroke="#F4552F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* =========== MARQUEE =========== */}
      <Marquee items={marqueeItems} speed={30} />

      {/* =========== ONE LOOP =========== */}
      <section className="py-20 sm:py-[120px] px-6 bg-paper border-y border-oxblood/10">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="One loop"
            title="From a want to a shelf."
            subtitle="Everyone built a shopper assistant or a merchant assistant. We built the loop between them."
            align="center"
            className="mb-14"
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-[2px] bg-blush overflow-hidden"
              aria-hidden="true"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full w-full bg-persimmon origin-left"
              />
            </motion.div>
            {loopNodes.map((node, i) => (
              <motion.div key={node.title} variants={fadeInUp} className="relative text-center space-y-3 px-2">
                <span className="relative z-10 w-16 h-16 mx-auto arch bg-blush border border-apricot/50 flex items-center justify-center font-serif text-xl text-persimmon">
                  {i + 1}
                </span>
                <h3 className="font-serif text-xl text-oxblood">{node.title}</h3>
                <p className="text-oxblood/75 text-sm leading-relaxed">{node.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========== TWO SIDES =========== */}
      <section className="bg-blush/50 py-20 sm:py-[120px] px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Shoppers */}
            <motion.div variants={fadeInUp}>
              <Card variant="paper" hoverEffect className="h-full space-y-5 p-8">
                <div className="w-14 h-14 rounded-2xl bg-persimmon/10 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-persimmon" />
                </div>
                <h3 className="font-serif text-3xl text-oxblood">For shoppers</h3>
                <p className="text-oxblood/80 leading-relaxed">
                  Describe what you're looking for by uploading a photo, speaking
                  naturally, or starting a conversation. No filters, no frustration —
                  just intuition made searchable.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <Camera className="w-3.5 h-3.5 text-hibiscus" /> Visual Search
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <Search className="w-3.5 h-3.5 text-hibiscus" /> Semantic Search
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <MessageCircle className="w-3.5 h-3.5 text-hibiscus" /> Chat
                  </span>
                </div>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-persimmon font-semibold text-sm hover:text-vermilion transition-colors pt-2 group"
                >
                  Try Shopper Studio
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Card>
            </motion.div>

            {/* Merchants */}
            <motion.div variants={fadeInUp}>
              <Card variant="paper" hoverEffect className="h-full space-y-5 p-8">
                <div className="w-14 h-14 rounded-2xl bg-hibiscus/10 flex items-center justify-center">
                  <Store className="w-7 h-7 text-hibiscus" />
                </div>
                <h3 className="font-serif text-3xl text-oxblood">For merchants</h3>
                <p className="text-oxblood/80 leading-relaxed">
                  Ask your store anything in plain English. Demand Radar surfaces
                  what shoppers asked for and you don't stock — before the sales
                  data ever could. The SQL is always visible.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <MessageCircle className="w-3.5 h-3.5 text-hibiscus" /> NL → SQL
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <Lightbulb className="w-3.5 h-3.5 text-hibiscus" /> Demand Radar
                  </span>
                </div>
                <Link
                  to="/merchant"
                  className="inline-flex items-center gap-2 text-hibiscus font-semibold text-sm hover:text-vermilion transition-colors pt-2 group"
                >
                  Try Merchant Desk
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========== PROBLEM TEASER =========== */}
      <section className="bg-oxblood py-20 sm:py-[120px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.blockquote
            variants={fadeInUp}
            className="font-serif text-3xl sm:text-5xl text-paper/95 leading-tight italic"
          >
            "A customer walks in knowing exactly what they want —
            <br className="hidden sm:inline" />
            but they can't describe it in your filter menu."
          </motion.blockquote>
          <motion.p
            variants={fadeInUp}
            className="text-paper/70 text-base sm:text-lg max-w-xl mx-auto"
          >
            That gap between human intention and machine understanding is where
            retail loses its best conversations. We're closing it — on both sides
            of the counter.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link to="/problem">
              <Button variant="primary" size="lg" className="bg-coral hover:bg-persimmon">
                Read the problem we're solving
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* =========== FOOTER CTA =========== */}
      <section className="bg-gradient-to-r from-apricot via-coral to-persimmon py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-serif text-4xl sm:text-5xl text-paper leading-tight"
          >
            Ready to see what your store knows?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-paper/85 text-lg">
            Start with a question, an image, or a conversation.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link to="/shop">
              <Button size="lg" className="bg-oxblood text-paper hover:bg-oxblood/90 border-0">
                <ShoppingBag className="w-5 h-5" />
                Shop now
              </Button>
            </Link>
            <Link to="/merchant">
              <Button variant="ghost" size="lg" className="text-paper border-2 border-paper/40 hover:bg-paper/10">
                <Store className="w-5 h-5" />
                Merchant view
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};
