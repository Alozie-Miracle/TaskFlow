'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { TaskTable } from '@/components/TaskTable';
import { TaskBoard } from '@/components/TaskBoard';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/context/ToastContext';
import { Task, Assignee, Priority, Status } from '@/types';
import {
  Search,
  Filter,
  Plus,
  LayoutList,
  Kanban,
  RotateCcw,
  SlidersHorizontal,
  X,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Dialogs
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchTasksAndAssignees = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (assigneeFilter !== 'all') params.append('assigneeId', assigneeFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const [tasksRes, asgRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch('/api/assignees'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (asgRes.ok) {
        const asgData = await asgRes.json();
        setAssignees(asgData.assignees || []);
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchTasksAndAssignees();

    const handleUpdate = () => fetchTasksAndAssignees();
    window.addEventListener('taskflow:task-updated', handleUpdate);
    return () => window.removeEventListener('taskflow:task-updated', handleUpdate);
  }, [fetchTasksAndAssignees]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  const isFiltered =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    assigneeFilter !== 'all';

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchTasksAndAssignees();
      } else {
        toast.error('Failed to update status');
        fetchTasksAndAssignees();
      }
    } catch {
      toast.error('Network error');
      fetchTasksAndAssignees();
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${taskToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Task "${taskToDelete.title}" deleted.`);
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        setTaskToDelete(null);
      } else {
        toast.error('Failed to delete task.');
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Task Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create, organize, filter, and track deliverables across your organization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                id="view-mode-board-btn"
                onClick={() => setViewMode('board')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
            </div>

            {/* Create Task Button */}
            <button
              id="tasks-create-btn"
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Filters & Controls Toolbar */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Input (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="tasks-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by task title, description, assignee..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter (2 cols) */}
            <div className="lg:col-span-2">
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Status: All</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority Filter (2 cols) */}
            <div className="lg:col-span-2">
              <select
                id="filter-priority-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Priority: All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Assignee Filter (3 cols) */}
            <div className="lg:col-span-3">
              <select
                id="filter-assignee-select"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Assignee: All Team</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map((asg) => (
                  <option key={asg.id} value={asg.id}>
                    {asg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Count */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong>{tasks.length}</strong> tasks
            </span>

            {isFiltered && (
              <button
                id="clear-filters-btn"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* View Component: Table or Board */}
        {viewMode === 'table' ? (
          <TaskTable
            tasks={tasks}
            assignees={assignees}
            isLoading={isLoading}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={(task) => setTaskToDelete(task)}
            onStatusChange={handleStatusChange}
            onCreateTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            isFiltered={isFiltered}
            onClearFilters={handleClearFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ) : (
          <TaskBoard
            tasks={tasks}
            assignees={assignees}
            isLoading={isLoading}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={(task) => setTaskToDelete(task)}
            onStatusChange={handleStatusChange}
            onCreateTaskWithStatus={(initStatus) => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSaved={() => {
          toast.success(taskToEdit ? 'Task updated successfully' : 'Task created successfully');
          fetchTasksAndAssignees();
        }}
        taskToEdit={taskToEdit}
        assignees={assignees}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
