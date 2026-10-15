import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Search, RefreshCw, MessageCircle, Copy, Check, TrendingUp, Package, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useMerchantAlerts, useMerchantAsk, useMerchantOverview, useDemandGaps } from '../hooks/useApi';
import { formatCurrency, formatCompactINR } from '../lib/brand';
import type { MerchantAskResponse, MerchantAlert } from '../lib/types';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const CHART_COLORS = ['#F4552F', '#E8336F', '#FFB690', '#FF9DB5', '#FF7A66', '#C3261F'];

const PLACEHOLDER_QUESTIONS = [
  'Which items will run out this week?',
  'Top 5 categories by revenue last month',
  'What sold the most this month?',
  'Show me slow-moving inventory',
];

function humanizeHeader(col: string): string {
  return col
    .replace(/^_+|_+$/g, '')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isMoneyColumn(col: string): boolean {
  return /revenue|price|amount|value|total|sales|cost/i.test(col);
}

function formatCell(cell: string | number, col: string): string {
  if (typeof cell !== 'number') return cell;
  if (isMoneyColumn(col)) return formatCurrency(cell);
  return cell.toLocaleString('en-IN');
}

function useCountUp(target: number, duration = 900): number {
  const prefersReduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    // Zero duration = jump straight to the target on the first frame.
    const effective = prefersReduced ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = effective <= 0 ? 1 : Math.min((now - start) / effective, 1);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, prefersReduced]);
  return value;
}

function KpiCard({ label, value, money, delta, icon }: { label: string; value: number; money?: boolean; delta?: number | null; icon: React.ReactNode }) {
  const animated = useCountUp(value);
  const display = money ? formatCompactINR(animated) : Math.round(animated).toLocaleString('en-IN');
  return (
    <Card variant="paper" className="p-5 space-y-1">
      <div className="flex items-center gap-2 text-oxblood/60">
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-serif text-3xl text-oxblood tabular-nums">{display}</p>
      {delta != null && (
        <span className={`inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-hibiscus/10 text-hibiscus' : 'bg-vermilion/10 text-vermilion'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prior 30d
        </span>
      )}
    </Card>
  );
}

export const MerchantDesk: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const { data: alertsData, isLoading: alertsLoading, isError: alertsError } = useMerchantAlerts();
  const { data: overview, isLoading: overviewLoading, isError: overviewError } = useMerchantOverview();
  const { data: gapsData, isLoading: gapsLoading, isError: gapsError } = useDemandGaps(14);
  const merchantAsk = useMerchantAsk();

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
        setCopied(false);
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

  const copySql = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const result: MerchantAskResponse | undefined = merchantAsk.data;

  return (
    <div className="min-h-screen">
      {/* Header Band (compact) */}
      <section className="bg-oxblood grain px-6 py-10 sm:py-12">
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
        {/* =========== KPI ROW =========== */}
        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {overviewError && !overviewLoading ? (
            <Card variant="paper" className="p-5 sm:col-span-2 xl:col-span-4 text-sm text-oxblood/70 text-center">
              Could not load store KPIs. Check backend connectivity.
            </Card>
          ) : overviewLoading || !overview ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="paper" className="p-5 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
              </Card>
            ))
          ) : (
            <>
              <KpiCard label="Revenue · 30d" value={overview.revenue_30d} money delta={overview.revenue_delta_pct} icon={<TrendingUp className="w-4 h-4" />} />
              <KpiCard label="Units sold · 30d" value={overview.units_30d} icon={<Package className="w-4 h-4" />} />
              <KpiCard label="Items at risk" value={overview.at_risk_count} icon={<AlertTriangle className="w-4 h-4" />} />
              <KpiCard label="Unmet demand · 7d" value={overview.unmet_demand_week} icon={<Users className="w-4 h-4" />} />
            </>
          )}
        </section>

        {/* =========== DEMAND RADAR =========== */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-oxblood flex items-center gap-2">
            <Users className="w-5 h-5 text-hibiscus" />
            Demand Radar
            <span className="text-xs font-mono font-normal text-oxblood/50">what shoppers asked for and you don't stock</span>
          </h2>

          {gapsLoading && (
            <div className="grid md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} variant="paper" className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </Card>
              ))}
            </div>
          )}

          {gapsError && !gapsLoading && (
            <Card variant="paper" className="p-6 text-sm text-oxblood/70 text-center">
              Could not load Demand Radar. Check backend connectivity.
            </Card>
          )}

          {gapsData && gapsData.gaps.length === 0 && !gapsLoading && (
            <Card variant="paper" className="p-6 text-sm text-oxblood/70">
              No unmet demand in the last 14 days. Every search found something.
            </Card>
          )}

          {gapsData && gapsData.gaps.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {gapsData.gaps.map((gap, idx) => (
                <motion.div
                  key={gap.theme}
                  initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card variant="blush" className="p-5 space-y-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg text-oxblood leading-snug capitalize">{gap.theme}</h3>
                      <span className="shrink-0 text-xs font-mono font-bold bg-hibiscus/10 text-hibiscus px-2 py-1 rounded-full">
                        {gap.query_count} asked
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gap.example_queries.map((q) => (
                        <Chip key={q} label={q.length > 32 ? q.slice(0, 29) + '…' : q} variant="blush" />
                      ))}
                    </div>
                    <p className="text-xs text-oxblood/80 leading-relaxed">{gap.suggested_action}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

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
              {alertsData.alerts.map((alert: MerchantAlert, idx: number) => {
                const cover = alert.days_until_out;
                const urgent = cover != null && cover < 5;
                return (
                  <motion.div
                    key={alert.product.id}
                    initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex-shrink-0 w-80 snap-start"
                  >
                    <Card variant="paper" className={`relative p-5 space-y-3 border-l-4 overflow-hidden ${urgent ? 'border-l-vermilion' : 'border-l-apricot'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 flex-shrink-0">
                          <div className="arch-sm overflow-hidden w-full h-full bg-blush photo-warm-wrap">
                            <img
                              src={alert.product.image_url}
                              alt={alert.product.name}
                              loading="lazy"
                              className="w-full h-full object-cover photo-warm"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-sm font-semibold text-oxblood truncate">{alert.product.name}</h4>
                          <span className="text-xs text-oxblood/60 font-mono">{alert.product.category}</span>
                        </div>
                      </div>

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

                      {cover != null && (
                        <p className={`text-xs font-mono font-semibold ${urgent ? 'text-vermilion' : 'text-oxblood/70'}`}>
                          {cover <= 0 ? 'Out of stock' : `≈ ${cover} days of cover left`}
                        </p>
                      )}

                      <p className="text-xs text-oxblood/80 leading-relaxed bg-blush/40 px-3 py-2 rounded-xl">
                        {alert.recommendation}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
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
              className="disabled:opacity-40"
            >
              {merchantAsk.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>

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

          {!merchantAsk.data && !merchantAsk.isPending && !merchantAsk.isError && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono text-oxblood/50 self-center mr-1">Try:</span>
              {PLACEHOLDER_QUESTIONS.map((q) => (
                <Chip key={q} label={q} variant="blush" onClick={() => handleAsk(q)} />
              ))}
            </div>
          )}

          {merchantAsk.isPending && (
            <Card variant="paper" className="space-y-4 p-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          )}

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

          {result && !merchantAsk.isPending && (
            <AskResult result={result} copySql={copySql} copied={copied} showSql={showSql} setShowSql={setShowSql} />
          )}
        </section>
      </div>
    </div>
  );
};

// =========== Ask result rendering ===========
function AskResult({
  result, copySql, copied, showSql, setShowSql,
}: {
  result: MerchantAskResponse;
  copySql: (sql: string) => void;
  copied: boolean;
  showSql: boolean;
  setShowSql: (v: boolean) => void;
}) {
  const isSingleNumber =
    result.rows.length === 1 && result.rows[0].length <= 2 &&
    (typeof result.rows[0][result.rows[0].length - 1] === 'number');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {isSingleNumber ? (
        <SingleNumberCard result={result} />
      ) : (
        <>
          <motion.div variants={fadeInUp}>
            <InsightCard result={result} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Card variant="paper" className="p-6">
              <MerchantChart data={result} />
            </Card>
          </motion.div>
        </>
      )}

      {/* Data Table (skip for single-number answers — the KPI card is the answer) */}
      {!isSingleNumber && (
        <motion.div variants={fadeInUp}>
          <Card variant="paper" className="p-6 overflow-x-auto">
            <table className="w-full text-sm text-oxblood">
              <thead>
                <tr className="border-b border-apricot/40">
                  {result.columns.map((col: string) => (
                    <th key={col} className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-oxblood/60 text-right first:text-left">
                      {humanizeHeader(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row: (string | number)[], i: number) => (
                  <tr key={i} className="border-b border-blush/60 hover:bg-blush/20 transition-colors">
                    {row.map((cell: string | number, j: number) => (
                      <td key={j} className="py-2.5 px-4 font-mono text-xs text-right first:text-left tabular-nums">
                        {formatCell(cell, result.columns[j] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </motion.div>
      )}

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
                <div className="flex items-start justify-between gap-3">
                  <pre className="font-mono text-xs text-oxblood/90 whitespace-pre-wrap leading-relaxed overflow-x-auto flex-1">
                    {result.sql}
                  </pre>
                  <button
                    onClick={() => copySql(result.sql)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-oxblood/60 hover:text-oxblood px-2.5 py-1.5 rounded-lg border border-oxblood/15 hover:border-oxblood/30 transition-colors cursor-pointer"
                    aria-label="Copy SQL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function InsightCard({ result }: { result: MerchantAskResponse }) {
  return (
    <Card variant="blush" className="p-8 space-y-3">
      <p className="font-serif text-xl sm:text-2xl text-oxblood leading-relaxed">
        {result.insight.headline}
      </p>
      {result.insight.why && (
        <p className="text-oxblood/75 text-sm leading-relaxed">{result.insight.why}</p>
      )}
      {result.insight.action && (
        <span className="inline-block text-xs font-semibold bg-persimmon/10 text-persimmon px-3 py-1.5 rounded-full">
          Do this next: {result.insight.action}
        </span>
      )}
    </Card>
  );
}

function SingleNumberCard({ result }: { result: MerchantAskResponse }) {
  const row = result.rows[0];
  const label = row.length === 2 ? String(row[0]) : result.columns[0] ?? 'Result';
  const value = row[row.length - 1];
  const display = typeof value === 'number'
    ? (isMoneyColumn(result.columns[result.columns.length - 1] ?? '') || value >= 1000
      ? formatCompactINR(value)
      : value.toLocaleString('en-IN'))
    : String(value);
  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <Card variant="blush" className="p-8 text-center space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-oxblood/60">{humanizeHeader(label)}</p>
        <p className="font-serif text-5xl sm:text-6xl text-oxblood tabular-nums">{display}</p>
        {result.delta_pct != null && (
          <span className={`inline-block text-sm font-mono font-semibold px-3 py-1 rounded-full ${result.delta_pct >= 0 ? 'bg-hibiscus/10 text-hibiscus' : 'bg-vermilion/10 text-vermilion'}`}>
            {result.delta_pct >= 0 ? '▲' : '▼'} {Math.abs(result.delta_pct).toFixed(1)}% vs previous period
          </span>
        )}
      </Card>
      <InsightCard result={result} />
    </motion.div>
  );
}

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
  const looksLikeDate = (col: string, rows: (string | number)[][]) =>
    /date|month|week|day/i.test(col) ||
    rows.slice(0, 3).every((r) => typeof r[0] === 'string' && /^\d{4}-\d{2}/.test(r[0] as string));

  if (data.chart_type === 'number') {
    return null;
  }

  if (data.chart_type === 'line' || (data.chart_type !== 'bar' && data.chart_type !== 'pie' && looksLikeDate(labelKey, data.rows))) {
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

  if (valueKeys.length === 0) {
    return (
      <p className="text-sm text-oxblood/60 italic text-center py-4">Data is shown in the table below.</p>
    );
  }

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
};
