import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';
import { Priority, Status } from '@/types';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search')?.toLowerCase() || '';
  const status = searchParams.get('status') as Status | 'all' | null;
  const priority = searchParams.get('priority') as Priority | 'all' | null;
  const assigneeId = searchParams.get('assigneeId');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  let tasks = serverStore.getTasks();

  // Filter by search query
  if (search) {
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        (t.assignee && t.assignee.name.toLowerCase().includes(search))
    );
  }

  // Filter by status
  if (status && status !== 'all') {
    tasks = tasks.filter((t) => t.status === status);
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  // Filter by assigneeId
  if (assigneeId && assigneeId !== 'all') {
    if (assigneeId === 'unassigned') {
      tasks = tasks.filter((t) => !t.assigneeId);
    } else {
      tasks = tasks.filter((t) => t.assigneeId === assigneeId);
    }
  }

  // Sort
  tasks.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'priority') {
      const pWeights: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
      comparison = pWeights[a.priority] - pWeights[b.priority];
    } else {
      // default createdAt
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return NextResponse.json({ tasks, total: tasks.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, assigneeId, priority, status, dueDate } = body;

    // Server-side validation
    const errors: Record<string, string> = {};
    if (!title || !title.trim()) {
      errors.title = 'Task title is required.';
    } else if (title.trim().length < 3) {
      errors.title = 'Task title must be at least 3 characters.';
    }

    if (!description || !description.trim()) {
      errors.description = 'Task description is required.';
    }

    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      errors.priority = 'Valid priority (low, medium, high) is required.';
    }

    if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
      errors.status = 'Valid status (todo, in_progress, completed) is required.';
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      errors.dueDate = 'Valid due date (YYYY-MM-DD) is required.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const newTask = serverStore.createTask({
      title,
      description,
      assigneeId: assigneeId || null,
      priority,
      status,
      dueDate,
    });

    return NextResponse.json({ task: newTask, message: 'Task created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}
