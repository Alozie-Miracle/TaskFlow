'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Plus,
  Moon,
  Sun,
  User,
  LogOut,
  RotateCcw,
  Shield,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  onCreateTask: () => void;
  onCreateAssignee: () => void;
}

export function Header({
  onToggleSidebar,
  onCreateTask,
  onCreateAssignee,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Close user menu on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu-trigger]') && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname === '/tasks') return 'Task Management';
    if (pathname.startsWith('/tasks/')) return 'Task Details';
    if (pathname === '/assignees') return 'Team & Assignees';
    if (pathname.startsWith('/assignees/')) return 'Assignee Profile';
    return 'Workspace';
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        toast.success('Workspace reset to initial seed data.');
        window.location.reload();
      } else {
        toast.error('Failed to reset data');
      }
    } catch {
      toast.error('Error resetting store');
    } finally {
      setIsResetting(false);
      setIsUserMenuOpen(false);
    }
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors"
    >
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Theme, & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: Create Task */}
        <button
          id="header-create-task-btn"
          onClick={onCreateTask}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {/* Quick Action: New Assignee */}
        <button
          id="header-create-assignee-btn"
          onClick={onCreateAssignee}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Assignee</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            id="user-menu-trigger"
            data-user-menu-trigger="true"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left shadow-2xs"
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {getInitials(user?.name || 'Admin User')}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
              {user?.name || 'Admin'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div
              data-user-menu="true"
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-40 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Profile summary */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>Admin Access</span>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="sm:hidden px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onCreateTask();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Create Task</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onCreateAssignee();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>New Assignee</span>
                </button>
              </div>

              {/* Reset Demo Data */}
              <div className="py-1">
                <button
                  id="user-menu-reset-btn"
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reset Demo Data</span>
                </button>
              </div>

              {/* Logout */}
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  id="user-menu-logout-btn"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
