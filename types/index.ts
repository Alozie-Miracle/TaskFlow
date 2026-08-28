export type Priority = 'Low' | 'Medium' | 'High';

export type Status = 'Todo' | 'In Progress' | 'Completed';

export interface Assignee {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface TaskActivity {
  _id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  assignee?: Assignee | null;
  priority: Priority;
  status: Status;
  dueDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  activities?: TaskActivity[];
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
}

export interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalAssignees: number;
  overdueTasks: number;
  upcomingTasks: number;
  completionRate: number;
}

export interface TaskFilters {
  search?: string;
  status?: Status | 'all';
  priority?: Priority | 'all';
  assigneeId?: string | 'all' | 'unassigned';
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}
