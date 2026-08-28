import { Assignee, Task } from '@/types';

export const INITIAL_ASSIGNEES: Assignee[] = [
  {
    id: 'asg-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.io',
    role: 'Lead Frontend Engineer',
    department: 'Engineering',
    avatarColor: 'bg-indigo-500',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'asg-2',
    name: 'Alex Rivera',
    email: 'alex.r@enterprise.io',
    role: 'Staff Product Designer',
    department: 'Product Design',
    avatarColor: 'bg-emerald-500',
    createdAt: '2026-01-20T10:30:00.000Z',
  },
  {
    id: 'asg-3',
    name: 'Marcus Chen',
    email: 'marcus.c@enterprise.io',
    role: 'Senior Backend Architect',
    department: 'Platform Engineering',
    avatarColor: 'bg-amber-500',
    createdAt: '2026-02-01T14:15:00.000Z',
  },
  {
    id: 'asg-4',
    name: 'Elena Rostova',
    email: 'elena.r@enterprise.io',
    role: 'Senior QA & Security Lead',
    department: 'Quality & Compliance',
    avatarColor: 'bg-rose-500',
    createdAt: '2026-02-10T08:45:00.000Z',
  },
  {
    id: 'asg-5',
    name: 'David Kim',
    email: 'david.k@enterprise.io',
    role: 'DevOps Specialist',
    department: 'Infrastructure',
    avatarColor: 'bg-purple-500',
    createdAt: '2026-02-18T11:20:00.000Z',
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Implement OAuth 2.0 PKCE Authorization Layer',
    description: 'Refactor client authentication flow to support secure PKCE handshake with token rotation and session refresh fallback.',
    assigneeId: 'asg-3',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-08-29',
    createdAt: '2026-08-20T09:30:00.000Z',
    updatedAt: '2026-08-27T11:00:00.000Z',
    activities: [
      {
        id: 'act-1',
        timestamp: '2026-08-20T09:30:00.000Z',
        action: 'Created task',
        user: 'Admin',
        details: 'Initial task creation with High priority'
      },
      {
        id: 'act-2',
        timestamp: '2026-08-21T10:00:00.000Z',
        action: 'Assigned to Marcus Chen',
        user: 'Admin'
      },
      {
        id: 'act-3',
        timestamp: '2026-08-25T14:20:00.000Z',
        action: 'Status changed to In Progress',
        user: 'Marcus Chen'
      }
    ]
  },
  {
    id: 'task-102',
    title: 'Audit WCAG 2.1 AA Color Contrast across Navigation',
    description: 'Ensure all primary sidebar navigation items, status pills, and interactive buttons pass minimum 4.5:1 contrast standards in both light and dark themes.',
    assigneeId: 'asg-2',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-08-30',
    createdAt: '2026-08-22T13:00:00.000Z',
    updatedAt: '2026-08-26T15:30:00.000Z',
    activities: [
      {
        id: 'act-4',
        timestamp: '2026-08-22T13:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      },
      {
        id: 'act-5',
        timestamp: '2026-08-22T13:05:00.000Z',
        action: 'Assigned to Alex Rivera',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-103',
    title: 'Migrate React Query Hydration for SSR Pages',
    description: 'Streamline server-side prefetching on task details and assignee overview pages to prevent client layout shift and minimize TTFB.',
    assigneeId: 'asg-1',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-08-26', // Overdue relative to 2026-08-27
    createdAt: '2026-08-18T10:15:00.000Z',
    updatedAt: '2026-08-27T08:45:00.000Z',
    activities: [
      {
        id: 'act-6',
        timestamp: '2026-08-18T10:15:00.000Z',
        action: 'Created task',
        user: 'Admin'
      },
      {
        id: 'act-7',
        timestamp: '2026-08-19T09:00:00.000Z',
        action: 'Assigned to Sarah Jenkins',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-104',
    title: 'Setup Automated Cypress End-to-End Test Suite',
    description: 'Cover primary user journeys: Login flow, task creation, assignee deletion warning policies, and filter persistence.',
    assigneeId: 'asg-4',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-08-25',
    createdAt: '2026-08-15T11:00:00.000Z',
    updatedAt: '2026-08-25T16:00:00.000Z',
    activities: [
      {
        id: 'act-8',
        timestamp: '2026-08-15T11:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      },
      {
        id: 'act-9',
        timestamp: '2026-08-25T16:00:00.000Z',
        action: 'Status changed to Completed',
        user: 'Elena Rostova',
        details: 'All 24 test suites passing in CI pipeline'
      }
    ]
  },
  {
    id: 'task-105',
    title: 'Configure Zero-Downtime Rolling Deployments in Kubernetes',
    description: 'Set readiness and liveness probes, pod disruption budgets, and autoscaling metrics for high-traffic workload spikes.',
    assigneeId: 'asg-5',
    priority: 'low',
    status: 'completed',
    dueDate: '2026-08-24',
    createdAt: '2026-08-14T08:00:00.000Z',
    updatedAt: '2026-08-24T18:00:00.000Z',
    activities: [
      {
        id: 'act-10',
        timestamp: '2026-08-14T08:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-106',
    title: 'Design Responsive Mobile Drawer & Touch Controls',
    description: 'Refine side navigation and table row interaction gestures for viewport widths under 768px with full accessibility focus trap.',
    assigneeId: 'asg-2',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-08-31',
    createdAt: '2026-08-23T14:30:00.000Z',
    updatedAt: '2026-08-27T09:15:00.000Z',
    activities: [
      {
        id: 'act-11',
        timestamp: '2026-08-23T14:30:00.000Z',
        action: 'Created task',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-107',
    title: 'Penetration Testing & Dependency Vulnerability Scan',
    description: 'Run Snyk and Dependabot security audits, patch vulnerable sub-dependencies, and verify CSP HTTP headers.',
    assigneeId: 'asg-4',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-08-28', // Upcoming soon
    createdAt: '2026-08-24T16:00:00.000Z',
    updatedAt: '2026-08-24T16:00:00.000Z',
    activities: [
      {
        id: 'act-12',
        timestamp: '2026-08-24T16:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-108',
    title: 'Update Global API Documentation in OpenAPI 3.1 Spec',
    description: 'Synchronize payload schemas, error status codes, and authorization header examples for public developer portal.',
    assigneeId: null, // Unassigned example
    priority: 'low',
    status: 'todo',
    dueDate: '2026-09-05',
    createdAt: '2026-08-25T11:45:00.000Z',
    updatedAt: '2026-08-25T11:45:00.000Z',
    activities: [
      {
        id: 'act-13',
        timestamp: '2026-08-25T11:45:00.000Z',
        action: 'Created task (Unassigned)',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-109',
    title: 'Optimize Database Query Indexes on Foreign Keys',
    description: 'Add composite B-Tree indexes to speed up assignee task aggregation queries under high concurrent loads.',
    assigneeId: 'asg-3',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-08-22',
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-22T17:30:00.000Z',
    activities: [
      {
        id: 'act-14',
        timestamp: '2026-08-16T12:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      }
    ]
  },
  {
    id: 'task-110',
    title: 'Build Dark Mode Color Tokens & CSS Variables',
    description: 'Verify contrast levels across all slate/zinc dark surface palettes and ensure smooth transitions.',
    assigneeId: 'asg-1',
    priority: 'low',
    status: 'in_progress',
    dueDate: '2026-09-02',
    createdAt: '2026-08-26T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
    activities: [
      {
        id: 'act-15',
        timestamp: '2026-08-26T10:00:00.000Z',
        action: 'Created task',
        user: 'Admin'
      }
    ]
  }
];

export const DEMO_ADMIN = {
  id: 'usr-admin-1',
  email: 'admin@example.com',
  name: 'Operations Administrator',
  role: 'admin' as const,
};
