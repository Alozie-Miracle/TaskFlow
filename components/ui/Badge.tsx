import React from 'react';
import { Priority, Status } from '@/types';
import {
  formatPriority,
  formatStatus,
  getPriorityStyles,
  getPriorityDotColor,
  getStatusStyles,
  getStatusDotColor,
  cn,
} from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({
  priority,
  className,
  showDot = true,
}: {
  priority: Priority;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors',
        getPriorityStyles(priority),
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', getPriorityDotColor(priority))} />}
      {formatPriority(priority)}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: Status;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors',
        getStatusStyles(status),
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDotColor(status))} />}
      {formatStatus(status)}
    </span>
  );
}
