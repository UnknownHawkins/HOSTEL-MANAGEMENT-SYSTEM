import * as React from 'react';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: 'default' | 'status';
}

export function Badge({ className, status, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        variant === 'status' && status ? getStatusColor(status) : 'bg-primary/15 text-primary border-primary/30',
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
}
