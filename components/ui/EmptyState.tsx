import React from 'react';
import { LucideIcon, PlusCircle, FolderKanban, Users, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  id?: string;
}

export function EmptyState({
  icon: Icon = FolderKanban,
  title,
  description,
  actionLabel,
  onAction,
  className,
  id = 'empty-state-card',
}: EmptyStateProps) {
  return (
    <div
      id={id}
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4 border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          id={`${id}-action-btn`}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function FilterEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matching results"
      description="We couldn't find any items matching your active search or filter criteria. Try adjusting or clearing your filters."
      actionLabel="Clear all filters"
      onAction={onClear}
      id="filter-empty-state"
    />
  );
}

export function TasksEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={FolderKanban}
      title="No tasks created yet"
      description="Start organizing your team's workflow by creating and assigning your first task."
      actionLabel="Create First Task"
      onAction={onCreate}
      id="tasks-empty-state"
    />
  );
}

export function AssigneesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members yet"
      description="Add assignees and team members to start assigning work and tracking progress."
      actionLabel="Add Team Member"
      onAction={onCreate}
      id="assignees-empty-state"
    />
  );
}
