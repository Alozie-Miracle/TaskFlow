import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assignee = serverStore.getAssigneeById(id);

  if (!assignee) {
    return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
  }

  const tasks = serverStore.getTasksByAssignee(id);
  const activeTasks = tasks.filter((t) => t.status !== 'completed').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return NextResponse.json({
    assignee: {
      ...assignee,
      taskCount: tasks.length,
      activeTasks,
      completedTasks,
    },
    tasks,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, department, avatarColor } = body;

    const errors: Record<string, string> = {};
    if (name !== undefined && !name.trim()) {
      errors.name = 'Full name cannot be empty.';
    }
    if (email !== undefined) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Valid email is required.';
      } else {
        const existing = serverStore
          .getAssignees()
          .find((a) => a.id !== id && a.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
          errors.email = 'An assignee with this email already exists.';
        }
      }
    }
    if (role !== undefined && !role.trim()) {
      errors.role = 'Role cannot be empty.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updated = serverStore.updateAssignee(id, {
      name,
      email,
      role,
      department,
      avatarColor,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
    }

    return NextResponse.json({ assignee: updated, message: 'Assignee updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to update assignee.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = serverStore.deleteAssignee(id);

  if (!result.success) {
    return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    unassignedTasksCount: result.unassignedTasksCount,
    message: `Assignee deleted successfully. ${result.unassignedTasksCount} task(s) unassigned.`,
  });
}
