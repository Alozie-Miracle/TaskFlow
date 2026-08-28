'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { AssigneeModal } from '@/components/AssigneeModal';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/context/ToastContext';
import { Assignee, Task, Status } from '@/types';
import {
  Mail,
  Briefcase,
  Calendar,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import {
  formatDate,
  getDueDateStatus,
  getInitials,
  cn,
} from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface AssigneeWithMetrics extends Assignee {
  taskCount: number;
  activeTasks: number;
  completedTasks: number;
}

export default function AssigneeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assignee, setAssignee] = useState<AssigneeWithMetrics | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allAssignees, setAllAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search/filter tasks inside assignee page
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchAssigneeData = React.useCallback(async () => {
    try {
      const [asgRes, allAsgRes] = await Promise.all([
        fetch(`/api/assignees/${id}`),
        fetch('/api/assignees'),
      ]);

      if (asgRes.ok) {
        const data = await asgRes.json();
        setAssignee(data.assignee);
        setTasks(data.tasks || []);
      } else {
        toast.error('Team member not found');
        router.push('/assignees');
      }

      if (allAsgRes.ok) {
        const allData = await allAsgRes.json();
        setAllAssignees(allData.assignees || []);
      }
    } catch {
      toast.error('Failed to load team member data');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchAssigneeData();
  }, [fetchAssigneeData]);

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
        fetchAssigneeData();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteAssignee = async () => {
    if (!assignee) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/assignees/${assignee._id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Member deleted. ${data.unassignedTasksCount} task(s) unassigned.`);
        router.push('/assignees');
      } else {
        toast.error('Failed to delete assignee');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !assignee) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !taskSearch.trim() ||
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completionRate =
    assignee.taskCount > 0
      ? Math.round((assignee.completedTasks / assignee.taskCount) * 100)
      : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href="/assignees"
              className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              Assignees
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">
              {assignee.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="assignee-detail-edit-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              id="assignee-detail-delete-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Profile Hero Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Member Info */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md shrink-0',
                  assignee.avatarColor || 'bg-blue-600'
                )}
              >
                {getInitials(assignee.name)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {assignee.name}
                </h1>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  {assignee.role}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{assignee.email}</span>
                  </div>
                  {assignee.department && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{assignee.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-xs text-slate-500">Assigned</span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {assignee.taskCount}
                </p>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700 px-2 sm:px-4">
                <span className="text-xs text-purple-600 dark:text-purple-400">In Progress</span>
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {assignee.activeTasks}
                </p>
              </div>
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Completed</span>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {assignee.completedTasks}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Assigned Deliverables ({tasks.length})
              </h2>
              <p className="text-xs text-slate-500">
                Tasks currently routed to {assignee.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Task status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <button
                id="assignee-create-task-btn"
                onClick={() => setIsTaskModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign New Task</span>
              </button>
            </div>
          </div>

          {/* Filtered Task Table */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No matching tasks found for this member.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Task</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                  {filteredTasks.map((t) => {
                    const dueMeta = getDueDateStatus(t.dueDate, t.status);

                    return (
                      <tr
                        key={t._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-sm">
                          <Link
                            href={`/tasks/${t._id}`}
                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                          >
                            {t.title}
                          </Link>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                            {t.description}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t._id, e.target.value as Status)}
                            className={cn(
                              'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none bg-transparent',
                              t.status === 'Todo' &&
                                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                              t.status === 'In Progress' &&
                                'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
                              t.status === 'Completed' &&
                                'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            )}
                          >
                            <option value="todo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                              Todo
                            </option>
                            <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                              In Progress
                            </option>
                            <option value="completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                              Completed
                            </option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn('text-xs', dueMeta.className)}>{dueMeta.label}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/tasks/${t._id}`}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Assignee Modal */}
      <AssigneeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          toast.success('Member profile updated');
          fetchAssigneeData();
        }}
        assigneeToEdit={assignee}
      />

      {/* Assign New Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => {
          toast.success('Task created and assigned');
          fetchAssigneeData();
        }}
        assignees={allAssignees}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAssignee}
        title="Delete Team Member"
        description={`Are you sure you want to delete ${assignee.name}?`}
        details={
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-300 mb-1">
              Deletion Warning:
            </p>
            <p>
              Deleting this user will unassign <strong>{assignee.activeTasks} active tasks</strong>.
              These tasks will be preserved in the system as Unassigned.
            </p>
          </div>
        }
        confirmLabel="Confirm & Unassign"
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
