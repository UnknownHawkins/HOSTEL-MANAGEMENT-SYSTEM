'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'purple' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const colorMap = {
  purple: {
    bg: 'from-violet-500/20 to-violet-600/10',
    icon: 'bg-violet-500/20 text-violet-400',
    border: 'hover:border-violet-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/10',
    icon: 'bg-blue-500/20 text-blue-400',
    border: 'hover:border-blue-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    icon: 'bg-cyan-500/20 text-cyan-400',
    border: 'hover:border-cyan-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    border: 'hover:border-emerald-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]',
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-600/10',
    icon: 'bg-amber-500/20 text-amber-400',
    border: 'hover:border-amber-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]',
  },
  rose: {
    bg: 'from-rose-500/20 to-rose-600/10',
    icon: 'bg-rose-500/20 text-rose-400',
    border: 'hover:border-rose-500/40',
    glow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
  },
};

export function StatCard({ title, value, icon, trend, color = 'purple', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'stat-card p-5 relative overflow-hidden',
        c.border,
        c.glow,
        'transition-all duration-300',
        className
      )}
    >
      {/* Gradient blob */}
      <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 bg-gradient-to-br', c.bg)} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn('p-2.5 rounded-xl', c.icon)}>{icon}</div>
        </div>

        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {trend.value >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span
              className={cn('text-xs font-medium', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
