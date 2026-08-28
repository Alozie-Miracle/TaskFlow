'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { TaskModal } from '@/components/TaskModal';
import { useToast } from '@/components/context/ToastContext';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { DashboardStats, Task, Assignee, Status } from '@/types';
import { formatDate, getDueDateStatus, getInitials, cn } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [assigneeWorkload, setAssigneeWorkload] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const toast = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, asgRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/assignees'),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setStats(data.stats);
        setOverdueTasks(data.overdueTasks || []);
        setUpcomingTasks(data.upcomingTasks || []);
        setRecentActivities(data.recentActivities || []);
        setAssigneeWorkload(data.assigneeWorkload || []);
        setRecentTasks(data.recentTasks || []);
      }

      if (asgRes.ok) {
        const asgData = await asgRes.json();
        setAssignees(asgData.assignees || []);
      }
    } catch {
      toast.error('Failed to load dashboard telemetry');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();

    // Listen to global updates
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('taskflow:task-updated', handleUpdate);
    window.addEventListener('taskflow:assignee-updated', handleUpdate);

    return () => {
      window.removeEventListener('taskflow:task-updated', handleUpdate);
      window.removeEventListener('taskflow:assignee-updated', handleUpdate);
    };
  }, [fetchDashboardData]);

  const handleQuickStatusChange = async (taskId: string, newStatus: Status) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
        fetchDashboardData();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Hero Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Operations Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitor team capacity, track active deliverables, and resolve upcoming bottlenecks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="dashboard-new-task-cta"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* 4-Column Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading || !stats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Card 1: Total Tasks */}
              <div
                id="stat-card-total-tasks"
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Tasks
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.totalTasks}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({stats.todoTasks} backlog)
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    {stats.completionRate}%
                  </span>
                  <span>completion rate</span>
                </div>
              </div>

              {/* Card 2: In Progress */}
              <div
                id="stat-card-in-progress"
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    In Progress
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.inProgressTasks}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Active stream
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Card 3: Completed */}
              <div
                id="stat-card-completed"
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Completed
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.completedTasks}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Done
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Card 4: Active Assignees */}
              <div
                id="stat-card-assignees"
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Assignees
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.totalAssignees}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">team members</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Capacity distributed</span>
                  <Link
                    href="/assignees"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Overview Section: Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recent Activity & Recent Tasks (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recent Activity / Task Stream */}
            {/* <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Recent Activity Stream
                  </h2>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>All Tasks</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentActivities.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No activity recorded yet.
                  </p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="py-3 flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        {getInitials(act.user || 'Admin')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {act.action}
                          </p>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {formatDate(act.timestamp)}
                          </span>
                        </div>
                        <Link
                          href={`/tasks/${act.taskId}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-1 mt-0.5"
                        >
                          {act.taskTitle}
                        </Link>
                        {act.details && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {act.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div> */}

            {/* Workload Distribution by Team Member */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Assignee Workload
                </h2>
                <Link
                  href="/assignees"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Manage Team</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3.5">
                {assigneeWorkload.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No assignees found.</p>
                ) : (
                  assigneeWorkload.map((asg) => (
                    <div
                      key={asg.id}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                            asg.avatarColor || 'bg-indigo-500'
                          )}
                        >
                          {getInitials(asg.name)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/assignees/${asg.id}`}
                            className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 truncate block"
                          >
                            {asg.name}
                          </Link>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {asg.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {asg.inProgress} active
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {asg.total} total
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Overdue / Upcoming Warning Panel & Quick Status Stream (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Overdue / Upcoming Task Warning Panel */}
            <div
              id="overdue-upcoming-warning-panel"
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Deadline Warnings
                  </h2>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {overdueTasks.length} Overdue
                </span>
              </div>

              {/* Overdue Tasks List */}
              <div className="mt-4 space-y-3">
                {overdueTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                      Immediate Action Required
                    </h3>
                    <div className="space-y-2">
                      {overdueTasks.map((t) => {
                        const dueMeta = getDueDateStatus(t.dueDate, t.status);
                        return (
                          <div
                            key={t._id}
                            className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/tasks/${t._id}`}
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 line-clamp-1"
                              >
                                {t.title}
                              </Link>
                              <PriorityBadge priority={t.priority} showDot={false} />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {dueMeta.label}
                              </span>
                              <button
                                onClick={() => handleQuickStatusChange(t._id, 'Completed')}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                Mark Done →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Tasks */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Upcoming Deadlines
                  </h3>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      No impending deadlines.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingTasks.map((t) => {
                        const dueMeta = getDueDateStatus(t.dueDate, t.status);
                        return (
                          <div
                            key={t._id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/tasks/${t._id}`}
                                className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 truncate block"
                              >
                                {t.title}
                              </Link>
                              <span className="text-[11px] text-slate-500">
                                {t.assignee ? t.assignee.name : 'Unassigned'}
                              </span>
                            </div>
                            <span className={cn('text-xs shrink-0', dueMeta.className)}>
                              {dueMeta.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links / Help */}
            <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 text-xs">
              <h3 className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                Admin Workflow Tips
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Use the <strong>Tasks</strong> tab to toggle between Table view and interactive
                Kanban columns. Delete assignees safely with automatic task unassignment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => {
          toast.success('Task created successfully');
          fetchDashboardData();
        }}
        assignees={assignees}
      />
    </AppLayout>
  );
}
