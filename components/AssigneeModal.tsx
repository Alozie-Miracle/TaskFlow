'use client';

import React, { useState, useEffect } from 'react';
import { Assignee } from '@/types';
import { Modal } from './ui/Modal';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssigneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (assignee: Assignee) => void;
  assigneeToEdit?: Assignee | null;
}

const COLOR_OPTIONS = [
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'Indigo', class: 'bg-indigo-600' },
  { name: 'Emerald', class: 'bg-emerald-600' },
  { name: 'Amber', class: 'bg-amber-600' },
  { name: 'Rose', class: 'bg-rose-600' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Cyan', class: 'bg-cyan-600' },
  { name: 'Teal', class: 'bg-teal-600' },
];

export function AssigneeModal({
  isOpen,
  onClose,
  onSaved,
  assigneeToEdit,
}: AssigneeModalProps) {
  const isEditing = Boolean(assigneeToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [avatarColor, setAvatarColor] = useState('bg-blue-600');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assigneeToEdit) {
      setName(assigneeToEdit.name);
      setEmail(assigneeToEdit.email);
      setRole(assigneeToEdit.role);
      setDepartment(assigneeToEdit.department || 'Engineering');
      setAvatarColor(assigneeToEdit.avatarColor || 'bg-blue-600');
    } else {
      setName('');
      setEmail('');
      setRole('');
      setDepartment('Engineering');
      setAvatarColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].class);
    }
    setErrors({});
  }, [assigneeToEdit, isOpen]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Full name is required.';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email format (e.g. name@company.io).';
    }
    if (!role.trim()) {
      errs.role = 'Role / Job title is required.';
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
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        department: department.trim(),
        avatarColor,
      };

      const url = isEditing ? `/api/assignees/${assigneeToEdit!._id}` : '/api/assignees';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.assignee) {
        onSaved(data.assignee);
        onClose();
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ form: data.error || 'Failed to save assignee' });
      }
    } catch {
      setErrors({ form: 'Network error. Please check your connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Team Member' : 'Add New Team Member'}
      description={
        isEditing
          ? 'Update contact details, job title, and department assignment.'
          : 'Add a new assignee to your workspace to assign tasks and track velocity.'
      }
      maxWidth="md"
      id="assignee-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label
            htmlFor="assignee-name-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="assignee-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Jordan Hayes"
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.name
                ? 'border-rose-300 dark:border-rose-700'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.name && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="assignee-email-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="assignee-email-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="e.g. jordan.h@company.io"
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.email
                ? 'border-rose-300 dark:border-rose-700'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.email && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {/* Role / Job Title */}
        <div>
          <label
            htmlFor="assignee-role-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Role / Job Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="assignee-role-input"
            type="text"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
            }}
            placeholder="e.g. Senior Frontend Engineer"
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.role
                ? 'border-rose-300 dark:border-rose-700'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.role && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.role}
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="assignee-dept-select"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Department
          </label>
          <select
            id="assignee-dept-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Engineering">Engineering</option>
            <option value="Product Design">Product Design</option>
            <option value="Platform Engineering">Platform Engineering</option>
            <option value="Quality & Compliance">Quality & Compliance</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Product Management">Product Management</option>
            <option value="Marketing & Growth">Marketing & Growth</option>
          </select>
        </div>

        {/* Avatar Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Avatar Theme
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.name}
                type="button"
                id={`avatar-color-${c.name.toLowerCase()}`}
                onClick={() => setAvatarColor(c.class)}
                className={cn(
                  'w-8 h-8 rounded-full transition-transform flex items-center justify-center text-white cursor-pointer',
                  c.class,
                  avatarColor === c.class
                    ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110'
                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                )}
                title={c.name}
              >
                {avatarColor === c.class && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            id="assignee-modal-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="assignee-modal-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
