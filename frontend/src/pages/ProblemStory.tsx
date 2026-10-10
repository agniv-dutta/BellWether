import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Cpu, Database, Cloud, Boxes, HardDrive } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export const ProblemStory: React.FC = () => {
  const prefersReduced = useReducedMotion();

  return (
    <div className="overflow-hidden">
      {/* =========== OPENING =========== */}
      <section className="mesh-hero grain min-h-[60vh] flex items-center px-6 py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto space-y-6"
        >
          <motion.span
            variants={fadeInUp}
            className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-hibiscus bg-hibiscus/10 px-4 py-1.5 rounded-full border border-hibiscus/20"
          >
            The Problem Statement
          </motion.span>
          <motion.h1
            variants={fadeInUp}
            className="text-display text-4xl sm:text-6xl md:text-7xl text-oxblood leading-[0.95]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            Shopping is a conversation.<br />
            <span className="text-persimmon">Stores forgot how to listen.</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-oxblood/80 max-w-2xl leading-relaxed"
          >
            Retail & Commerce: Intelligent Consumer & Operational Interactions — the
            challenge is to bridge the gap between what people mean and what search
            boxes understand.
          </motion.p>
        </motion.div>
      </section>

      {/* =========== THE GAP =========== */}
      <section className="bg-blush/50 py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="The Gap"
            title="Two worlds, not talking."
            align="center"
            className="mb-16"
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Shoppers Column */}
            <motion.div variants={fadeInUp}>
              <Card variant="paper" className="h-full space-y-5 p-8">
                <div className="flex items-center gap-3 pb-2 border-b border-blush">
                  <span className="w-10 h-10 rounded-full bg-persimmon text-paper flex items-center justify-center font-serif font-bold text-lg">S</span>
                  <h3 className="font-serif text-2xl text-oxblood">What shoppers do</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Search for "something like this photo" — and get a keyword-empty results page.',
                    'Describe a "warm linen shirt, not too fitted" — and the filter menu offers S / M / L.',
                    'Abandon their cart because zero results for "earrings for a quiet wedding" sounds like a dead end.',
                  ].map((point, i) => (
                    <li key={i} className="flex gap-3 text-oxblood/80 text-sm leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-persimmon/15 text-persimmon flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Stores Column */}
            <motion.div variants={fadeInUp}>
              <Card variant="paper" className="h-full space-y-5 p-8">
                <div className="flex items-center gap-3 pb-2 border-b border-blush">
                  <span className="w-10 h-10 rounded-full bg-hibiscus text-paper flex items-center justify-center font-serif font-bold text-lg">M</span>
                  <h3 className="font-serif text-2xl text-oxblood">What stores see</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Dashboard says "0 results" but can\'t explain why — or what the customer actually wanted.',
                    'Bestsellers stock out silently while slow movers take up shelf space for months.',
                    'Asking "which items sell best in monsoon?" requires a data analyst, three queries, and a meeting.',
                  ].map((point, i) => (
                    <li key={i} className="flex gap-3 text-oxblood/80 text-sm leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-hibiscus/15 text-hibiscus flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========== OUR ANSWER =========== */}
      <section className="py-20 sm:py-28 px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="Our Answer"
            title="One intelligence, both sides."
            align="center"
            className="mb-16"
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0"
          >
            {/* Shopper Node */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center z-10">
              <div className="arch bg-blush border-2 border-apricot/50 px-8 pt-10 pb-6 shadow-oxblood-md text-center min-w-[160px]">
                <span className="font-serif text-2xl text-oxblood">Shopper</span>
                <p className="text-xs text-oxblood/70 mt-2">Photo · Words · Chat</p>
              </div>
            </motion.div>

            {/* Connecting Line Left */}
            <motion.div
              variants={fadeInUp}
              className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-apricot to-persimmon"
            />
            <motion.div
              variants={fadeInUp}
              className="md:hidden w-0.5 h-12 bg-gradient-to-b from-apricot to-persimmon"
            />

            {/* Center Node — Jauhari */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center z-10">
              <div className="arch bg-gradient-to-b from-persimmon to-vermilion border-2 border-coral/60 px-10 pt-12 pb-8 shadow-oxblood-lg text-center min-w-[200px]">
                <span className="font-serif text-3xl text-paper font-bold">BellWether</span>
                <p className="text-xs text-paper/80 mt-2">Gemini · Embeddings · BigQuery-ready</p>
              </div>
            </motion.div>

            {/* Connecting Line Right */}
            <motion.div
              variants={fadeInUp}
              className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-persimmon to-hibiscus"
            />
            <motion.div
              variants={fadeInUp}
              className="md:hidden w-0.5 h-12 bg-gradient-to-b from-persimmon to-hibiscus"
            />

            {/* Merchant Node */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center z-10">
              <div className="arch bg-blush border-2 border-flamingo/50 px-8 pt-10 pb-6 shadow-oxblood-md text-center min-w-[160px]">
                <span className="font-serif text-2xl text-oxblood">Merchant</span>
                <p className="text-xs text-oxblood/70 mt-2">Insights · Alerts · SQL</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========== IMPACT =========== */}
      <section className="bg-blush/40 py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="Target Impact"
            title="The numbers we're chasing."
            subtitle="These are illustrative targets based on common retail pain points — not invented metrics."
            align="center"
            className="mb-16"
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-8"
          >
            {[
              { stat: '~60%', label: 'Fewer zero-result searches', desc: 'Semantic understanding means fewer dead ends for shoppers.' },
              { stat: '~3×', label: 'Faster stock decisions', desc: 'Merchants get alerts instead of digging through reports.' },
              { stat: '~40%', label: 'Higher search-to-cart conversion', desc: 'Results that match intent, not just keywords.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card variant="paper" hoverEffect className="text-center space-y-3 p-8">
                  <span className="text-display text-5xl sm:text-6xl text-persimmon">{item.stat}</span>
                  <h3 className="font-serif text-xl text-oxblood">{item.label}</h3>
                  <p className="text-oxblood/75 text-sm leading-relaxed">{item.desc}</p>
                  <span className="inline-block text-[10px] font-mono text-oxblood/50 bg-blush px-2 py-0.5 rounded-full">
                    Illustrative target
                  </span>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========== TECH STRIP =========== */}
      <section className="py-16 px-6 bg-paper border-y border-apricot/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <SectionHeading
            eyebrow="Built on Google Cloud"
            title="The stack."
            align="center"
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={stagger}
            className="flex flex-wrap justify-center gap-3 pt-4"
          >
            {[
              { label: 'Gemini on Vertex AI', icon: <Cpu className="w-3.5 h-3.5" /> },
              { label: 'Embeddings API', icon: <Boxes className="w-3.5 h-3.5" /> },
              { label: 'Cloud Run', icon: <Cloud className="w-3.5 h-3.5" /> },
              { label: 'BigQuery', icon: <Database className="w-3.5 h-3.5" /> },
              { label: 'Cloud Storage', icon: <HardDrive className="w-3.5 h-3.5" /> },
            ].map((tech) => (
              <motion.div key={tech.label} variants={fadeInUp}>
                <Chip label={tech.label} variant="oxblood" icon={tech.icon} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========== CTA =========== */}
      <section className="bg-gradient-to-r from-apricot via-coral to-persimmon py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <motion.h2 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl text-paper">
            Enough reading. Try the thing.
          </motion.h2>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link to="/shop">
              <Button size="lg" className="bg-oxblood text-paper hover:bg-oxblood/90 border-0">
                Open Shopper Studio
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/merchant">
              <Button variant="ghost" size="lg" className="text-paper border-2 border-paper/40 hover:bg-paper/10">
                Open Merchant Desk
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};
