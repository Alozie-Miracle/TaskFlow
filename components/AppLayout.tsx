'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskModal } from './TaskModal';
import { AssigneeModal } from './AssigneeModal';
import { Task, Assignee } from '@/types';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const toast = useToast();
  const { user, isLoading } = useAuth();

  // Load assignees for global task creation modal
  const loadAssignees = async () => {
    try {
      const res = await fetch('/api/assignees');
      if (res.ok) {
        const data = await res.json();
        setAssignees(data.assignees || []);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadAssignees();
    }
  }, [user]);

  const handleTaskCreated = (newTask: Task) => {
    toast.success(`Task "${newTask.title}" created successfully.`);
    // Dispatch custom event to notify current page to refresh
    window.dispatchEvent(new CustomEvent('taskflow:task-updated', { detail: newTask }));
  };

  const handleAssigneeCreated = (newAssignee: Assignee) => {
    toast.success(`Team member ${newAssignee.name} added.`);
    setAssignees((prev) => [...prev, newAssignee]);
    window.dispatchEvent(new CustomEvent('taskflow:assignee-updated', { detail: newAssignee }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onCreateTask={() => {
            loadAssignees();
            setIsTaskModalOpen(true);
          }}
          onCreateAssignee={() => setIsAssigneeModalOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={handleTaskCreated}
        assignees={assignees}
      />

      <AssigneeModal
        isOpen={isAssigneeModalOpen}
        onClose={() => setIsAssigneeModalOpen(false)}
        onSaved={handleAssigneeCreated}
      />
    </div>
  );
}
