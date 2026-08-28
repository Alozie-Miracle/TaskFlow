import { Assignee, Task, Priority, Status, DashboardStats } from '@/types';
import { INITIAL_ASSIGNEES, INITIAL_TASKS } from './data';

// Server-side singleton memory store
declare global {
  var __taskStore: {
    assignees: Assignee[];
    tasks: Task[];
  } | undefined;
}

function getStore() {
  if (!globalThis.__taskStore) {
    globalThis.__taskStore = {
      assignees: JSON.parse(JSON.stringify(INITIAL_ASSIGNEES)),
      tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
    };
  }
  return globalThis.__taskStore;
}

export const serverStore = {
  getAssignees(): Assignee[] {
    return getStore().assignees;
  },

  getAssigneeById(id: string): Assignee | undefined {
    return getStore().assignees.find((a) => a.id === id);
  },

  createAssignee(data: Omit<Assignee, 'id' | 'createdAt'>): Assignee {
    const store = getStore();
    const newAssignee: Assignee = {
      id: `asg-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role.trim(),
      department: data.department?.trim() || 'General',
      avatarColor: data.avatarColor || 'bg-indigo-500',
      createdAt: new Date().toISOString(),
    };
    store.assignees.push(newAssignee);
    return newAssignee;
  },

  updateAssignee(id: string, data: Partial<Omit<Assignee, 'id' | 'createdAt'>>): Assignee | null {
    const store = getStore();
    const index = store.assignees.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const existing = store.assignees[index];
    const updated: Assignee = {
      ...existing,
      ...data,
      name: data.name ? data.name.trim() : existing.name,
      email: data.email ? data.email.trim().toLowerCase() : existing.email,
      role: data.role ? data.role.trim() : existing.role,
      department: data.department !== undefined ? data.department.trim() : existing.department,
    };
    store.assignees[index] = updated;
    return updated;
  },

  /**
   * Deletion Policy:
   * When an assignee is deleted, all their assigned tasks are automatically
   * unassigned (assigneeId set to null) to ensure no task is lost.
   * Returns { deleted: boolean, unassignedTasksCount: number }
   */
  deleteAssignee(id: string): { success: boolean; unassignedTasksCount: number } {
    const store = getStore();
    const index = store.assignees.findIndex((a) => a.id === id);
    if (index === -1) return { success: false, unassignedTasksCount: 0 };

    store.assignees.splice(index, 1);

    // Unassign tasks assigned to this user
    let unassignedCount = 0;
    store.tasks = store.tasks.map((task) => {
      if (task.assigneeId === id) {
        unassignedCount++;
        const now = new Date().toISOString();
        return {
          ...task,
          assigneeId: null,
          updatedAt: now,
          activities: [
            ...(task.activities || []),
            {
              id: `act-${Date.now()}-${Math.random()}`,
              timestamp: now,
              action: 'Unassigned due to assignee removal',
              user: 'System Admin',
            },
          ],
        };
      }
      return task;
    });

    return { success: true, unassignedTasksCount: unassignedCount };
  },

  getTasks(): Task[] {
    const store = getStore();
    const assigneesMap = new Map(store.assignees.map((a) => [a.id, a]));
    return store.tasks.map((t) => ({
      ...t,
      assignee: t.assigneeId ? assigneesMap.get(t.assigneeId) || null : null,
    }));
  },

  getTaskById(id: string): Task | undefined {
    const store = getStore();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    const assignee = task.assigneeId ? store.assignees.find((a) => a.id === task.assigneeId) || null : null;
    return {
      ...task,
      assignee,
    };
  },

  getTasksByAssignee(assigneeId: string): Task[] {
    return this.getTasks().filter((t) => t.assigneeId === assigneeId);
  },

  createTask(data: {
    title: string;
    description: string;
    assigneeId?: string | null;
    priority: Priority;
    status: Status;
    dueDate: string;
  }): Task {
    const store = getStore();
    const now = new Date().toISOString();
    const assignedUser = data.assigneeId ? store.assignees.find((a) => a.id === data.assigneeId) : null;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title.trim(),
      description: data.description.trim(),
      assigneeId: data.assigneeId || null,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
      activities: [
        {
          id: `act-${Date.now()}-1`,
          timestamp: now,
          action: 'Task created',
          user: 'Admin',
          details: assignedUser ? `Assigned to ${assignedUser.name}` : 'Created as Unassigned',
        },
      ],
    };

    store.tasks.unshift(newTask);
    return {
      ...newTask,
      assignee: assignedUser || null,
    };
  },

  updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      assigneeId: string | null;
      priority: Priority;
      status: Status;
      dueDate: string;
    }>
  ): Task | null {
    const store = getStore();
    const index = store.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = store.tasks[index];
    const now = new Date().toISOString();
    const activities = [...(existing.activities || [])];

    // Log status change if modified
    if (data.status && data.status !== existing.status) {
      activities.push({
        id: `act-${Date.now()}-st`,
        timestamp: now,
        action: `Status changed to ${data.status.replace('_', ' ').toUpperCase()}`,
        user: 'Admin',
      });
    }

    // Log assignee change if modified
    if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
      const newAssignee = data.assigneeId ? store.assignees.find((a) => a.id === data.assigneeId) : null;
      activities.push({
        id: `act-${Date.now()}-asg`,
        timestamp: now,
        action: newAssignee ? `Reassigned to ${newAssignee.name}` : 'Task unassigned',
        user: 'Admin',
      });
    }

    // Log priority change
    if (data.priority && data.priority !== existing.priority) {
      activities.push({
        id: `act-${Date.now()}-pr`,
        timestamp: now,
        action: `Priority updated to ${data.priority.toUpperCase()}`,
        user: 'Admin',
      });
    }

    const updated: Task = {
      ...existing,
      ...data,
      title: data.title !== undefined ? data.title.trim() : existing.title,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      updatedAt: now,
      activities,
    };

    store.tasks[index] = updated;
    const assignee = updated.assigneeId ? store.assignees.find((a) => a.id === updated.assigneeId) || null : null;
    return {
      ...updated,
      assignee,
    };
  },

  updateTaskStatus(id: string, status: Status): Task | null {
    return this.updateTask(id, { status });
  },

  deleteTask(id: string): boolean {
    const store = getStore();
    const index = store.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    store.tasks.splice(index, 1);
    return true;
  },

  getDashboardStats(): DashboardStats {
    const store = getStore();
    const tasks = store.tasks;
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalAssignees = store.assignees.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((t) => t.status !== 'completed' && t.dueDate < todayStr).length;
    const upcomingTasks = tasks.filter((t) => t.status !== 'completed' && t.dueDate >= todayStr).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalAssignees,
      overdueTasks,
      upcomingTasks,
      completionRate,
    };
  },

  resetToInitial() {
    const store = getStore();
    store.assignees = JSON.parse(JSON.stringify(INITIAL_ASSIGNEES));
    store.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
  },
};
