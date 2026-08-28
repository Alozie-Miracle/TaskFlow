import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = serverStore.getTaskById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, assigneeId, priority, status, dueDate } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (title !== undefined && (!title.trim() || title.trim().length < 3)) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
      errors.priority = 'Invalid priority.';
    }
    if (status !== undefined && !['todo', 'in_progress', 'completed'].includes(status)) {
      errors.status = 'Invalid status.';
    }
    if (dueDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      errors.dueDate = 'Invalid due date format.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updated = serverStore.updateTask(id, {
      title,
      description,
      assigneeId,
      priority,
      status,
      dueDate,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: updated, message: 'Task updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = serverStore.deleteTask(id);

  if (!success) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Task deleted successfully' });
}
