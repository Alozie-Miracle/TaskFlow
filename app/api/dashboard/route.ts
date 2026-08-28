import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';

export async function GET() {
  const stats = serverStore.getDashboardStats();
  const allTasks = serverStore.getTasks();
  const assignees = serverStore.getAssignees();

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue and upcoming tasks
  const overdueTasks = allTasks
    .filter((t) => t.status !== 'completed' && t.dueDate < todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const upcomingTasks = allTasks
    .filter((t) => t.status !== 'completed' && t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Recent activity stream: extract activities across tasks
  const activities: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    timestamp: string;
    action: string;
    user: string;
    details?: string;
    priority: string;
    status: string;
  }> = [];

  allTasks.forEach((task) => {
    if (task.activities) {
      task.activities.forEach((act) => {
        activities.push({
          id: act.id,
          taskId: task.id,
          taskTitle: task.title,
          timestamp: act.timestamp,
          action: act.action,
          user: act.user,
          details: act.details,
          priority: task.priority,
          status: task.status,
        });
      });
    }
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivities = activities.slice(0, 7);

  // Assignee workload distribution
  const assigneeWorkload = assignees.map((asg) => {
    const userTasks = allTasks.filter((t) => t.assigneeId === asg.id);
    return {
      id: asg.id,
      name: asg.name,
      role: asg.role,
      avatarColor: asg.avatarColor,
      total: userTasks.length,
      todo: userTasks.filter((t) => t.status === 'todo').length,
      inProgress: userTasks.filter((t) => t.status === 'in_progress').length,
      completed: userTasks.filter((t) => t.status === 'completed').length,
    };
  });

  return NextResponse.json({
    stats,
    overdueTasks,
    upcomingTasks,
    recentActivities,
    assigneeWorkload,
    recentTasks: allTasks.slice(0, 6),
  });
}
