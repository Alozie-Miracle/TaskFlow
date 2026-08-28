'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/context/ToastContext';
import { Task, Assignee, Status, Priority } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Edit2,
  Trash2,
  CheckCircle2,
  Activity,
  Send,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  getDueDateStatus,
  getInitials,
  cn,
} from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Note/comment field
  const [newNote, setNewNote] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchTaskDetails = React.useCallback(async () => {
    try {
      const [taskRes, asgRes] = await Promise.all([
        fetch(`/api/tasks/${id}`),
        fetch('/api/assignees'),
      ]);

      if (taskRes.ok) {
        const data = await taskRes.json();
        setTask(data.task);
      } else {
        toast.error('Task not found');
        router.push('/tasks');
      }

      if (asgRes.ok) {
        const asgData = await asgRes.json();
        setAssignees(asgData.assignees || []);
      }
    } catch {
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStatusChange = async (newStatus: Status) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchTaskDetails();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleReassign = async (newAssigneeId: string) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: newAssigneeId || null }),
      });

      if (res.ok) {
        toast.success('Assignee updated successfully');
        fetchTaskDetails();
      } else {
        toast.error('Failed to reassign task');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !task) return;

    // Add note to task activities
    const now = new Date().toISOString();
    const updatedActivities = [
      ...(task.activities || []),
      {
        id: `act-note-${Date.now()}`,
        timestamp: now,
        action: 'Note added by Admin',
        user: 'Admin',
        details: newNote.trim(),
      },
    ];

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updatedActivities }),
      });

      if (res.ok) {
        toast.success('Note logged to activity history');
        setNewNote('');
        fetchTaskDetails();
      }
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Task deleted successfully');
        router.push('/tasks');
      } else {
        toast.error('Failed to delete task');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !task) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const dueMeta = getDueDateStatus(task.dueDate, task.status);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumbs & Top Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/tasks" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Tasks
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[200px] sm:max-w-md">
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="task-detail-edit-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              id="task-detail-delete-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header & Status Banner */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {task.title}
              </h1>

              {/* Status transition quick bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Quick Status:</span>
                {(['todo', 'in_progress', 'completed'] as Status[]).map((st) => (
                  <button
                    key={st}
                    id={`task-detail-status-btn-${st}`}
                    onClick={() => handleStatusChange(st)}
                    className={cn(
                      'px-3 py-1 text-xs font-semibold rounded-lg border transition-all capitalize cursor-pointer',
                      task.status === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Task Description
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {/* Activity History Timeline */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Activity & Audit Trail
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  {task.activities?.length || 0} events
                </span>
              </div>

              {/* Timeline list */}
              <div className="space-y-4 pt-2">
                {task.activities && task.activities.length > 0 ? (
                  task.activities.map((act, index) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs relative">
                      {index < task.activities!.length - 1 && (
                        <div className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                      )}
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold z-10">
                        {getInitials(act.user)}
                      </div>
                      <div className="flex-1 min-w-0 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {act.action}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(act.timestamp)}
                          </span>
                        </div>
                        {act.details && (
                          <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {act.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2">No activity events recorded.</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an internal progress note or comment..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Meta Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Assignee Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned Team Member
              </h3>

              {task.assignee ? (
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                        task.assignee.avatarColor || 'bg-indigo-500'
                      )}
                    >
                      {getInitials(task.assignee.name)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/assignees/${task.assignee.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 flex items-center gap-1"
                      >
                        <span className="truncate">{task.assignee.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {task.assignee.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    {task.assignee.email}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  This task is currently <strong>Unassigned</strong>. Choose a team member below to delegate work.
                </div>
              )}

              {/* Dynamic Reassign Select */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Change Assignee:
                </label>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">(Unassigned)</option>
                  {assignees.map((asg) => (
                    <option key={asg.id} value={asg.id}>
                      {asg.name} ({asg.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Metadata Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Metadata & Schedule
              </h3>

              <div className="space-y-3 text-xs">
                {/* Due Date */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Due Date:</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Calendar className={cn('w-3.5 h-3.5', dueMeta.className)} />
                    <span className={dueMeta.className}>{formatDate(task.dueDate)}</span>
                    <span className={cn('text-[11px] font-medium ml-1', dueMeta.className)}>
                      ({dueMeta.label})
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Priority Level:</span>
                  <PriorityBadge priority={task.priority} />
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Created:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatDate(task.createdAt)}
                  </span>
                </div>

                {/* Last Updated */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Last Modified:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatDate(task.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          toast.success('Task details updated');
          fetchTaskDetails();
        }}
        taskToEdit={task}
        assignees={assignees}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"?`}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
