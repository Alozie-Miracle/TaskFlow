'use client';

import React, { useState, useEffect } from 'react';
import { Task, Assignee, Priority, Status } from '@/types';
import { Modal } from './ui/Modal';
import { Calendar, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  taskToEdit?: Task | null;
  assignees: Assignee[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSaved,
  taskToEdit,
  assignees,
}: TaskModalProps) {
  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [dueDate, setDueDate] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with taskToEdit
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setAssigneeId(taskToEdit.assigneeId || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setDueDate(taskToEdit.dueDate);
    } else {
      // Default new task values
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setPriority('medium');
      setStatus('todo');
      // Default due date: 3 days from now
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(d.toISOString().split('T')[0]);
    }
    setErrors({});
  }, [taskToEdit, isOpen]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Title is required.';
    } else if (title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }
    if (!description.trim()) {
      errs.description = 'Description is required.';
    }
    if (!dueDate) {
      errs.dueDate = 'Due date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || null,
        priority,
        status,
        dueDate,
      };

      const url = isEditing ? `/api/tasks/${taskToEdit!.id}` : '/api/tasks';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.task) {
        onSaved(data.task);
        onClose();
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ form: data.error || 'Failed to save task' });
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setRelativeDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
    if (errors.dueDate) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.dueDate;
        return next;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update task details, assignees, status, and deadlines.'
          : 'Fill in the information below to assign work to your team.'
      }
      maxWidth="xl"
      id="task-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label
            htmlFor="task-title-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholder="e.g. Implement OAuth 2.0 PKCE Flow"
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.title
                ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.title && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.title}
            </p>
          )}
        </div>

        {/* Task Description */}
        <div>
          <label
            htmlFor="task-desc-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="task-desc-input"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            placeholder="Provide context, acceptance criteria, and technical guidelines..."
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.description
                ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.description}
            </p>
          )}
        </div>

        {/* Priority & Status Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority Radio Group */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    id={`priority-btn-${p}`}
                    onClick={() => setPriority(p)}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-all capitalize cursor-pointer',
                      p === 'low' &&
                        (isSelected
                          ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-white dark:border-slate-500 ring-2 ring-slate-400/30'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200/60'),
                      p === 'medium' &&
                        (isSelected
                          ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-500 ring-2 ring-amber-400/30'
                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 hover:bg-amber-100/60'),
                      p === 'high' &&
                        (isSelected
                          ? 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-500 ring-2 ring-rose-400/30'
                          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 hover:bg-rose-100/60')
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Select */}
          <div>
            <label
              htmlFor="task-status-select"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Status
            </label>
            <select
              id="task-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Assignee & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dynamic Assignee Select */}
          <div>
            <label
              htmlFor="task-assignee-select"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Assignee
            </label>
            <div className="relative">
              <select
                id="task-assignee-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">(Unassigned)</option>
                {assignees.map((asg) => (
                  <option key={asg.id} value={asg.id}>
                    {asg.name} — {asg.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="task-due-date-input"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Due Date <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => setRelativeDate(0)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDate(1)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Tmrw
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDate(7)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  +1 Wk
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
                }}
                className={cn(
                  'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.dueDate
                    ? 'border-rose-300 dark:border-rose-700'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              />
            </div>
            {errors.dueDate && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                {errors.dueDate}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            id="task-modal-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="task-modal-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
