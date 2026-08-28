import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Priority, Status } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStatus(status: Status): string {
  switch (status) {
    case 'Todo':
      return 'Todo';
    case 'In Progress':
      return 'In Progress';
    case 'Completed':
      return 'Complete';
    default:
      return status;
  }
}

export function formatPriority(priority: Priority): string {
  switch (priority) {
    case 'Low':
      return 'Low';
    case 'Medium':
      return 'Medium';
    case 'High':
      return 'High';
    default:
      return priority;
  }
}

export function getPriorityStyles(priority: Priority): string {
  switch (priority) {
    case 'Low':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'Medium':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700';
    case 'High':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getPriorityDotColor(priority: Priority): string {
  switch (priority) {
    case 'Low':
      return 'bg-slate-500';
    case 'Medium':
      return 'bg-amber-500';
    case 'High':
      return 'bg-rose-500';
    default:
      return 'bg-slate-400';
  }
}

export function getStatusStyles(status: Status): string {
  switch (status) {
    case 'Todo':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    case 'In Progress':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusDotColor(status: Status): string {
  switch (status) {
    case 'Todo':
      return 'bg-blue-500';
    case 'In Progress':
      return 'bg-purple-500';
    case 'Completed':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-400';
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'No date';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getDueDateStatus(dueDate: string, status?: Status): {
  label: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  className: string;
} {
  if (!dueDate || status === 'Completed') {
    return {
      label: formatDate(dueDate),
      isOverdue: false,
      isDueSoon: false,
      className: 'text-slate-600 dark:text-slate-400',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + 'T00:00:00');
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: `${daysAgo}d overdue`,
      isOverdue: true,
      isDueSoon: false,
      className: 'text-rose-600 dark:text-rose-400 font-semibold',
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due today',
      isOverdue: false,
      isDueSoon: true,
      className: 'text-amber-600 dark:text-amber-400 font-semibold',
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      isOverdue: false,
      isDueSoon: true,
      className: 'text-amber-600 dark:text-amber-400 font-semibold',
    };
  } else if (diffDays <= 3) {
    return {
      label: `Due in ${diffDays}d`,
      isOverdue: false,
      isDueSoon: true,
      className: 'text-amber-600 dark:text-amber-400',
    };
  }

  return {
    label: formatDate(dueDate),
    isOverdue: false,
    isDueSoon: false,
    className: 'text-slate-600 dark:text-slate-400',
  };
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
