'use client';

import React from 'react';
import Link from 'next/link';
import { Task, Assignee, Status } from '@/types';
import { PriorityBadge } from './ui/Badge';
import {
  Calendar,
  MoreVertical,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Edit2,
  Trash2,
} from 'lucide-react';
import { getDueDateStatus, getInitials, cn } from '@/lib/utils';

interface TaskBoardProps {
  tasks: Task[];
  assignees: Assignee[];
  isLoading: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onCreateTaskWithStatus?: (status: Status) => void;
}

const COLUMNS: Array<{
  _id: Status;
  label: string;
  badgeClass: string;
  dotColor: string;
  headerBorder: string;
}> = [
  {
    _id: 'Todo',
    label: 'Todo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-500',
    headerBorder: 'border-blue-500',
  },
  {
    _id: 'In Progress',
    label: 'In Progress',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    dotColor: 'bg-purple-500',
    headerBorder: 'border-purple-500',
  },
  {
    _id: 'Completed',
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    headerBorder: 'border-emerald-500',
  },
];

export function TaskBoard({
  tasks,
  isLoading,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onCreateTaskWithStatus,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column._id);

        return (
          <div
            key={column._id}
            id={`board-column-${column._id}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column._id)}
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', column.dotColor)} />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {column.label}
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {columnTasks.length}
                </span>
              </div>
              {onCreateTaskWithStatus && (
                <button
                  id={`column-add-btn-${column._id}`}
                  onClick={() => onCreateTaskWithStatus(column._id)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  aria-label={`Add task to ${column.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Column Task Cards */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">No {column.label.toLowerCase()} tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const dueMeta = getDueDateStatus(task.dueDate, task.status);

                  return (
                    <div
                      key={task._id}
                      id={`board-task-card-${task._id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing space-y-3"
                    >
                      {/* Priority and Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <PriorityBadge priority={task.priority} />
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`board-edit-${task._id}`}
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`board-delete-${task._id}`}
                            onClick={() => onDeleteTask(task)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & description */}
                      <div>
                        <Link
                          href={`/tasks/${task._id}`}
                          className="block text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                        >
                          {task.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      {/* Footer: Due Date & Assignee */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className={cn('w-3.5 h-3.5', dueMeta.className)} />
                          <span className={dueMeta.className}>{dueMeta.label}</span>
                        </div>

                        {task.assignee ? (
                          <div
                            className="flex items-center gap-1.5"
                            title={`${task.assignee.name} (${task.assignee.role})`}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold',
                                task.assignee.avatarColor || 'bg-blue-600'
                              )}
                            >
                              {getInitials(task.assignee.name)}
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-[80px] truncate">
                              {task.assignee.name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </div>

                      {/* Move Status Quick Buttons */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        {column._id !== 'Todo' && (
                          <button
                            type="button"
                            onClick={() =>
                              onStatusChange(task._id, column._id === 'Completed' ? 'In Progress' : 'Todo')
                            }
                            className="inline-flex items-center gap-0.5 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Move back</span>
                          </button>
                        )}
                        <div className="flex-1" />
                        {column._id !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() =>
                              onStatusChange(task._id, column._id === 'Todo' ? 'In Progress' : 'Completed')
                            }
                            className="inline-flex items-center gap-0.5 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
