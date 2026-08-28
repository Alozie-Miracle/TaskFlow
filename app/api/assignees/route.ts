import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';

export async function GET() {
  const assignees = serverStore.getAssignees();
  const tasks = serverStore.getTasks();

  // Attach task metrics to each assignee
  const assigneesWithMetrics = assignees.map((assignee) => {
    const assignedTasks = tasks.filter((t) => t.assigneeId === assignee.id);
    const activeTasks = assignedTasks.filter((t) => t.status !== 'completed').length;
    const completedTasks = assignedTasks.filter((t) => t.status === 'completed').length;

    return {
      ...assignee,
      taskCount: assignedTasks.length,
      activeTasks,
      completedTasks,
    };
  });

  return NextResponse.json({ assignees: assigneesWithMetrics });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, department, avatarColor } = body;

    const errors: Record<string, string> = {};
    if (!name || !name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!email || !email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    } else {
      // Check duplicate email
      const existing = serverStore.getAssignees().find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        errors.email = 'An assignee with this email already exists.';
      }
    }
    if (!role || !role.trim()) {
      errors.role = 'Role / Job title is required.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const newAssignee = serverStore.createAssignee({
      name,
      email,
      role,
      department: department || 'General',
      avatarColor: avatarColor || 'bg-indigo-500',
    });

    return NextResponse.json({ assignee: newAssignee, message: 'Assignee created successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create assignee.' }, { status: 500 });
  }
}
