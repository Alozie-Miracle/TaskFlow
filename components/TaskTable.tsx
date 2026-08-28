'use client';

import React from 'react';
import Link from 'next/link';
import { Task, Assignee, Status, Priority } from '@/types';
import { PriorityBadge, StatusBadge } from './ui/Badge';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  User as UserIcon,
  CheckCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import {
  formatDate,
  getDueDateStatus,
  getInitials,
  cn,
} from '@/lib/utils';
import { TableRowSkeleton } from './ui/Skeleton';
import { FilterEmptyState, TasksEmptyState } from './ui/EmptyState';

interface TaskTableProps {
  tasks: Task[];
  assignees: Assignee[];
  isLoading: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onCreateTask: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function TaskTable({
  tasks,
  assignees,
  isLoading,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onCreateTask,
  isFiltered,
  onClearFilters,
  sortBy,
  sortOrder,
  onSort,
}: TaskTableProps) {
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-trigger]') && !target.closest('[data-dropdown-menu]')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Task</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
          </tbody>
        </table>
      </div>
    );
  }

  if (tasks.length === 0) {
    if (isFiltered && onClearFilters) {
      return <FilterEmptyState onClear={onClearFilters} />;
    }
    return <TasksEmptyState onCreate={onCreateTask} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <th
              className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200"
              onClick={() => onSort && onSort('title')}
            >
              <div className="flex items-center gap-1.5">
                <span>Task</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </th>
            <th className="py-3.5 px-4">Assignee</th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200"
              onClick={() => onSort && onSort('priority')}
            >
              <div className="flex items-center gap-1.5">
                <span>Priority</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </th>
            <th className="py-3.5 px-4">Status</th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200"
              onClick={() => onSort && onSort('dueDate')}
            >
              <div className="flex items-center gap-1.5">
                <span>Due Date</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
          {tasks.map((task) => {
            const dueMeta = getDueDateStatus(task.dueDate, task.status);
            const isMenuOpen = openDropdownId === task._id;

            return (
              <tr
                key={task._id}
                id={`task-row-${task._id}`}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                  <div className="flex flex-col">
                    <Link
                      href={`/tasks/${task._id}`}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 line-clamp-1"
                    >
                      <span>{task.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </span>
                  </div>
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4">
                  {task.assignee ? (
                    <Link
                      href={`/assignees/${task.assignee._id}`}
                      className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0',
                          task.assignee.avatarColor || 'bg-blue-600'
                        )}
                      >
                        {getInitials(task.assignee.name)}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {task.assignee.name}
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                      <UserIcon className="w-3.5 h-3.5" />
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4">
                  <PriorityBadge priority={task.priority} />
                </td>

                {/* Status (with inline quick change) */}
                <td className="py-3.5 px-4">
                  <div className="inline-flex items-center">
                    <select
                      id={`quick-status-${task._id}`}
                      value={task.status}
                      onChange={(e) => onStatusChange(task._id, e.target.value as Status)}
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent transition-all',
                        task.status === 'Todo' &&
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                        task.status === 'In Progress' &&
                          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
                        task.status === 'Completed' &&
                          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      )}
                    >
                      <option value="Todo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        Todo
                      </option>
                      <option value="In Progress" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        In Progress
                      </option>
                      <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        Completed
                      </option>
                    </select>
                  </div>
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className={cn('w-3.5 h-3.5 shrink-0', dueMeta.className)} />
                    <span className={dueMeta.className}>{dueMeta.label}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="relative inline-block text-left">
                    <button
                      id={`task-actions-btn-${task._id}`}
                      data-dropdown-trigger="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(isMenuOpen ? null : task._id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Open task actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        data-dropdown-menu="true"
                        className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <Link
                          href={`/tasks/${task._id}`}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Details</span>
                        </Link>
                        <button
                          id={`task-menu-edit-${task._id}`}
                          onClick={() => {
                            setOpenDropdownId(null);
                            onEditTask(task);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit Task</span>
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <button
                          id={`task-menu-delete-${task._id}`}
                          onClick={() => {
                            setOpenDropdownId(null);
                            onDeleteTask(task);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
