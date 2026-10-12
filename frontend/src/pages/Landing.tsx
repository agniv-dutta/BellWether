import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import { ShoppingBag, Store, Search, Camera, MessageCircle, ArrowRight, Eye, Lightbulb, Gem } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Marquee } from '../components/ui/Marquee';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const heroImages = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
];

const marqueeItems = [
  'a saree the colour of monsoon dusk',
  'linen shirt, relaxed fit',
  'something for a quiet wedding',
  'terracotta planter, handmade',
  'earrings that catch the light just so',
  'a throw blanket in warm peach',
  'brass bowl for floating marigolds',
];

export const Landing: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
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
          className="w-full max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
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
              Jauhari / जौहरी
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.95] text-oxblood"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
            >
              An eye for what's worth it.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-oxblood/80 max-w-lg leading-relaxed"
            >
              Show us what you love — a photo, a feeling, a few words — and we'll
              find the pieces that belong with it. For merchants, your store speaks
              for itself.
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

          {/* Right: Arch Images */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative hidden lg:flex items-end justify-center gap-6 min-h-[500px]"
          >
            {heroImages.map((src, idx) => {
              const offsets = [
                { rotate: -4, yOff: 0, height: 'h-[380px]' },
                { rotate: 2, yOff: -40, height: 'h-[430px]' },
                { rotate: -2, yOff: -15, height: 'h-[360px]' },
              ];
              const { rotate, yOff, height } = offsets[idx];

              return (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  animate={
                    prefersReduced
                      ? {}
                      : {
                          y: [yOff, yOff - 8, yOff],
                        }
                  }
                  transition={{
                    y: { repeat: Infinity, duration: 3 + idx * 0.7, ease: 'easeInOut' },
                  }}
                  className={`relative ${height} w-[160px] flex-shrink-0`}
                  style={{ transform: `rotate(${rotate}deg)` }}
                >
                  <div className="absolute -inset-1.5 rounded-[999px_999px_28px_28px] bg-gradient-to-b from-apricot/50 to-coral/30" />
                  <div className="relative arch overflow-hidden h-full w-full shadow-oxblood-md bg-blush">
                    <img
                      src={src}
                      alt={`Featured product ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-oxblood/30 via-transparent to-transparent" />
                  </div>
                </motion.div>
              );
            })}

            {/* Loupe ring */}
            <motion.div
              className="absolute pointer-events-none z-20"
              animate={
                prefersReduced
                  ? {}
                  : {
                      x: mousePos.x * 0.02 - 30,
                      y: mousePos.y * 0.02 - 30,
                    }
              }
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              style={{ top: '30%', right: '10%' }}
            >
              <div className="w-24 h-24 rounded-full border-4 border-persimmon/70 bg-persimmon/10 shadow-oxblood-md flex items-center justify-center">
                <Search className="w-8 h-8 text-persimmon/80" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* =========== MARQUEE =========== */}
      <Marquee items={marqueeItems} speed={30} />

      {/* =========== TWO SIDES =========== */}
      <section className="bg-blush/50 py-20 sm:py-28 px-6">
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
                  Ask your store anything in plain English. Stock alerts find
                  problems before you do. The SQL is always visible — no black
                  boxes, just clarity.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <MessageCircle className="w-3.5 h-3.5 text-hibiscus" /> NL → SQL
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono bg-blush px-3 py-1 rounded-full text-oxblood/80">
                    <Lightbulb className="w-3.5 h-3.5 text-hibiscus" /> Smart Alerts
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

      {/* =========== HOW IT WORKS =========== */}
      <section className="py-20 sm:py-28 px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="How it works"
            title="Three moments, one intent."
            align="center"
            className="mb-16"
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { num: '01', icon: Eye, title: 'Show it', desc: 'Upload a photo, paste a link, or describe the feeling you want.' },
              { num: '02', icon: Lightbulb, title: 'Understand it', desc: 'Our models parse colour, texture, occasion, and vibe — not just keywords.' },
              { num: '03', icon: Gem, title: 'Find it', desc: 'Results ranked by how well they match what you actually meant.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeInUp}
                className="text-center space-y-4 group"
              >
                <span className="text-display text-7xl sm:text-8xl text-apricot/60 group-hover:text-persimmon/40 transition-colors leading-none">
                  {step.num}
                </span>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-persimmon/10 flex items-center justify-center group-hover:bg-persimmon/20 transition-colors">
                  <step.icon className="w-7 h-7 text-persimmon" />
                </div>
                <h3 className="font-serif text-2xl text-oxblood">{step.title}</h3>
                <p className="text-oxblood/75 text-sm max-w-xs mx-auto leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========== PROBLEM TEASER =========== */}
      <section className="bg-oxblood py-20 sm:py-28 px-6">
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
            "A customer walks in knowing exactly what they want —<br className="hidden sm:inline" />
            but they can't describe it in your filter menu."
          </motion.blockquote>
          <motion.p
            variants={fadeInUp}
            className="text-paper/70 text-base sm:text-lg max-w-xl mx-auto"
          >
            That gap between human intention and machine understanding is where
            retail loses its best conversations. We're closing it.
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
