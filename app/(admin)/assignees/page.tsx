'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { AssigneeModal } from '@/components/AssigneeModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AssigneesEmptyState, FilterEmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/context/ToastContext';
import { Assignee } from '@/types';
import {
  Users,
  Plus,
  Search,
  Mail,
  Briefcase,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface AssigneeWithMetrics extends Assignee {
  taskCount: number;
  activeTasks: number;
  completedTasks: number;
}

export default function AssigneesPage() {
  const [assignees, setAssignees] = useState<AssigneeWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigneeToEdit, setAssigneeToEdit] = useState<Assignee | null>(null);
  const [assigneeToDelete, setAssigneeToDelete] = useState<AssigneeWithMetrics | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchAssignees = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assignees');
      if (res.ok) {
        const data = await res.json();
        setAssignees(data.assignees || []);
      }
    } catch {
      toast.error('Failed to load assignees');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssignees();

    const handleUpdate = () => fetchAssignees();
    window.addEventListener('taskflow:assignee-updated', handleUpdate);
    window.addEventListener('taskflow:task-updated', handleUpdate);

    return () => {
      window.removeEventListener('taskflow:assignee-updated', handleUpdate);
      window.removeEventListener('taskflow:task-updated', handleUpdate);
    };
  }, [fetchAssignees]);

  const filteredAssignees = assignees.filter((asg) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      asg.name.toLowerCase().includes(q) ||
      asg.email.toLowerCase().includes(q) ||
      asg.role.toLowerCase().includes(q) ||
      (asg.department && asg.department.toLowerCase().includes(q))
    );
  });

  const handleDeleteConfirm = async () => {
    if (!assigneeToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/assignees/${assigneeToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          `Assignee "${assigneeToDelete.name}" deleted. ${data.unassignedTasksCount} active task(s) unassigned.`
        );
        setAssignees((prev) => prev.filter((a) => a.id !== assigneeToDelete.id));
        setAssigneeToDelete(null);
        // Refresh tasks in case
        window.dispatchEvent(new CustomEvent('taskflow:task-updated'));
      } else {
        toast.error('Failed to delete assignee.');
      }
    } catch {
      toast.error('Network error during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Team & Assignees
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage workspace members, assign task responsibilities, and balance team bandwidth.
            </p>
          </div>

          <button
            id="assignees-create-btn"
            onClick={() => {
              setAssigneeToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="assignees-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name, role, email, department..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-slate-500 self-end sm:self-center">
            <strong>{filteredAssignees.length}</strong> team members
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredAssignees.length === 0 ? (
          search ? (
            <FilterEmptyState onClear={() => setSearch('')} />
          ) : (
            <AssigneesEmptyState
              onCreate={() => {
                setAssigneeToEdit(null);
                setIsModalOpen(true);
              }}
            />
          )
        ) : (
          /* Grid of Assignee Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignees.map((asg) => (
              <div
                key={asg.id}
                id={`assignee-card-${asg.id}`}
                className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Avatar & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0',
                          asg.avatarColor || 'bg-indigo-500'
                        )}
                      >
                        {getInitials(asg.name)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/assignees/${asg.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm truncate block"
                        >
                          {asg.name}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {asg.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`edit-assignee-btn-${asg.id}`}
                        onClick={() => {
                          setAssigneeToEdit(asg);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-assignee-btn-${asg.id}`}
                        onClick={() => setAssigneeToDelete(asg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata tags */}
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{asg.email}</span>
                    </div>
                    {asg.department && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span>{asg.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Workload Metric Strip */}
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Active Workload</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {asg.activeTasks} active / {asg.taskCount} total
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-500 h-full"
                        style={{
                          width: `${asg.taskCount > 0 ? (asg.activeTasks / asg.taskCount) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${asg.taskCount > 0 ? (asg.completedTasks / asg.taskCount) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>{asg.activeTasks} in progress</span>
                      <span>{asg.completedTasks} completed</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <Link
                  href={`/assignees/${asg.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-950/80 border border-blue-100 dark:border-blue-900/60 transition-colors"
                >
                  <span>View Member Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Assignee Modal */}
      <AssigneeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAssigneeToEdit(null);
        }}
        onSaved={() => {
          toast.success(
            assigneeToEdit ? 'Team member updated' : 'Team member added successfully'
          );
          fetchAssignees();
        }}
        assigneeToEdit={assigneeToEdit}
      />

      {/* Delete Confirmation Dialog with clear deletion policy warning */}
      <ConfirmDialog
        isOpen={Boolean(assigneeToDelete)}
        onClose={() => setAssigneeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team Member"
        description={`Are you sure you want to delete ${assigneeToDelete?.name}?`}
        details={
          assigneeToDelete && (
            <div>
              <p className="font-semibold text-rose-700 dark:text-rose-300 mb-1">
                System Deletion Policy:
              </p>
              <p>
                Deleting this member will automatically mark their{' '}
                <strong>{assigneeToDelete.activeTasks} active tasks</strong> (and {assigneeToDelete.taskCount} total tasks) as{' '}
                <span className="font-bold underline">Unassigned</span>. No deliverables or work history will be lost.
              </p>
            </div>
          )
        }
        confirmLabel="Confirm & Unassign Tasks"
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
