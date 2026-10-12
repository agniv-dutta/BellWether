import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Search, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useMerchantAlerts, useMerchantAsk } from '../hooks/useApi';
import type { MerchantAskResponse, MerchantAlert } from '../lib/types';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const CHART_COLORS = ['#F4552F', '#E8336F', '#FFB690', '#FF9DB5', '#FF7A66', '#C3261F'];

const PLACEHOLDER_QUESTIONS = [
  'Which items will run out this week?',
  'Top 5 categories by revenue last month',
  'What sold the most in monsoon season?',
  'Show me slow-moving inventory',
];

export const MerchantDesk: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const { data: alertsData, isLoading: alertsLoading, isError: alertsError } = useMerchantAlerts();
  const merchantAsk = useMerchantAsk();

  // Rotate placeholder
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_QUESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAsk = (q?: string) => {
    const questionText = q || question.trim();
    if (!questionText || merchantAsk.isPending) return;

    merchantAsk.mutate(questionText, {
      onSuccess: () => {
        setHistory((prev) => {
          const updated = [questionText, ...prev.filter((h) => h !== questionText)];
          return updated.slice(0, 5);
        });
        setShowSql(false);
      },
    });
    if (!q) setQuestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  const result: MerchantAskResponse | undefined = merchantAsk.data;

  return (
    <div className="min-h-screen">
      {/* Header Band */}
      <section className="bg-oxblood grain px-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Merchant Desk"
            title="Your store, in plain English."
            subtitle="Ask questions, see the data, read the SQL. No black boxes."
            dark
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* =========== ALERTS STRIP =========== */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-oxblood flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-vermilion" />
            Stock Alerts
          </h2>

          {alertsLoading && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 p-4 bg-paper border border-blush rounded-2xl space-y-3">
                  <Skeleton className="h-16 w-16" arch />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}

          {alertsError && (
            <Card variant="paper" className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-vermilion mx-auto mb-3" />
              <p className="text-oxblood/70 text-sm">Could not load alerts. Check backend connectivity.</p>
            </Card>
          )}

          {alertsData && (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {alertsData.alerts.map((alert: MerchantAlert, idx: number) => (
                <motion.div
                  key={alert.product.id}
                  initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex-shrink-0 w-80 snap-start"
                >
                  <Card variant="paper" className="relative p-5 space-y-3 border-l-4 border-l-vermilion overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 flex-shrink-0">
                        <div className="arch-sm overflow-hidden w-full h-full bg-blush">
                          <img
                            src={alert.product.image_url}
                            alt={alert.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif text-sm font-semibold text-oxblood truncate">{alert.product.name}</h4>
                        <span className="text-xs text-oxblood/60 font-mono">{alert.product.category}</span>
                      </div>
                    </div>

                    {/* Stock vs Velocity */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex-1">
                        <span className="text-oxblood/60">Stock</span>
                        <div className="mt-1 h-2 bg-blush rounded-full overflow-hidden">
                          <div
                            className="h-full bg-vermilion rounded-full transition-all"
                            style={{ width: `${Math.min((alert.stock / 30) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-vermilion font-bold">{alert.stock} units</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-oxblood/60">Velocity</span>
                        <div className="mt-1 h-2 bg-blush rounded-full overflow-hidden">
                          <div
                            className="h-full bg-hibiscus rounded-full transition-all"
                            style={{ width: `${Math.min((alert.velocity / 6) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-hibiscus font-bold">{alert.velocity}/day</span>
                      </div>
                    </div>

                    <p className="text-xs text-oxblood/80 leading-relaxed bg-blush/40 px-3 py-2 rounded-xl">
                      {alert.recommendation}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* =========== ASK YOUR STORE =========== */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl text-oxblood flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-hibiscus" />
            Ask your store
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER_QUESTIONS[placeholderIdx]}
              className="flex-1 px-5 py-4 bg-blush/30 border border-apricot/40 rounded-2xl text-base text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
              aria-label="Ask a question about your store"
            />
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleAsk()}
              disabled={merchantAsk.isPending || !question.trim()}
            >
              {merchantAsk.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* History Chips */}
          {history.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono text-oxblood/50 self-center mr-1">Recent:</span>
              {history.map((h) => (
                <Chip
                  key={h}
                  label={h.length > 40 ? h.slice(0, 37) + '…' : h}
                  variant="blush"
                  onClick={() => {
                    setQuestion(h);
                    handleAsk(h);
                  }}
                />
              ))}
            </div>
          )}

          {/* Loading State */}
          {merchantAsk.isPending && (
            <Card variant="paper" className="space-y-4 p-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          )}

          {/* Error State */}
          {merchantAsk.isError && (
            <Card variant="paper" className="text-center py-12 space-y-4">
              <AlertTriangle className="w-10 h-10 text-vermilion mx-auto" />
              <h3 className="font-serif text-xl text-oxblood">Query failed</h3>
              <p className="text-oxblood/70 text-sm">The backend couldn't process that question.</p>
              <Button variant="soft" onClick={() => merchantAsk.reset()}>
                <RefreshCw className="w-4 h-4" /> Clear and retry
              </Button>
            </Card>
          )}

          {/* Results */}
          {result && !merchantAsk.isPending && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              {/* Insight */}
              <motion.div variants={fadeInUp}>
                <Card variant="blush" className="p-8">
                  <p className="font-serif text-xl sm:text-2xl text-oxblood leading-relaxed">
                    {result.insight}
                  </p>
                </Card>
              </motion.div>

              {/* Chart */}
              <motion.div variants={fadeInUp}>
                <Card variant="paper" className="p-6">
                  <MerchantChart data={result} />
                </Card>
              </motion.div>

              {/* Data Table */}
              <motion.div variants={fadeInUp}>
                <Card variant="paper" className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-oxblood">
                    <thead>
                      <tr className="border-b border-apricot/40">
                        {result.columns.map((col: string) => (
                          <th key={col} className="py-3 px-4 text-left font-mono text-xs uppercase tracking-wider text-oxblood/60">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row: (string | number)[], i: number) => (
                        <tr key={i} className="border-b border-blush/60 hover:bg-blush/20 transition-colors">
                          {row.map((cell: string | number, j: number) => (
                            <td key={j} className="py-2.5 px-4 font-mono text-xs">
                              {typeof cell === 'number' ? cell.toLocaleString('en-IN') : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </motion.div>

              {/* SQL Panel */}
              <motion.div variants={fadeInUp}>
                <button
                  onClick={() => setShowSql(!showSql)}
                  className="flex items-center gap-2 text-sm text-oxblood/70 hover:text-oxblood font-medium transition-colors cursor-pointer"
                >
                  {showSql ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  How I got this — view the SQL
                </button>

                <AnimatePresence>
                  {showSql && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Card variant="paper" className="mt-3 p-5 bg-oxblood/5 border border-oxblood/15">
                        <pre className="font-mono text-xs text-oxblood/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {result.sql}
                        </pre>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

// =========== Chart Component ===========
const MerchantChart: React.FC<{ data: MerchantAskResponse }> = ({ data }) => {
  const chartData = data.rows.map((row) => {
    const obj: Record<string, string | number> = {};
    data.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  const labelKey = data.columns[0];
  const valueKeys = data.columns.slice(1).filter((col) => {
    return chartData.some((d) => typeof d[col] === 'number');
  });

  if (data.chart_type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFDCCF" />
          <XAxis dataKey={labelKey} tick={{ fill: '#4B0F1B', fontSize: 11 }} />
          <YAxis tick={{ fill: '#4B0F1B', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFF3EA', border: '1px solid #FFB690', borderRadius: 12, color: '#4B0F1B' }}
          />
          {valueKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[8, 8, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (data.chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFDCCF" />
          <XAxis dataKey={labelKey} tick={{ fill: '#4B0F1B', fontSize: 11 }} />
          <YAxis tick={{ fill: '#4B0F1B', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFF3EA', border: '1px solid #FFB690', borderRadius: 12, color: '#4B0F1B' }}
          />
          {valueKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS[i % CHART_COLORS.length], r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (data.chart_type === 'pie') {
    const valueKey = valueKeys[0] || data.columns[1];
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={valueKey}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {chartData.map((_: unknown, i: number) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#FFF3EA', border: '1px solid #FFB690', borderRadius: 12, color: '#4B0F1B' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Table type — already rendered in the parent, just show a note
  return (
    <p className="text-sm text-oxblood/60 italic text-center py-4">Data is shown in the table below.</p>
  );
};
