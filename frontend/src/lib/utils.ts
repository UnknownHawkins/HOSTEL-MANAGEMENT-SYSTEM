import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    OPEN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    IN_PROGRESS: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    CLOSED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    PAID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    PRESENT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ABSENT: 'bg-red-500/15 text-red-400 border-red-500/30',
    LEAVE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  return colors[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}
