import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/storage';
import { Status } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required.' }, { status: 400 });
    }

    const updated = serverStore.updateTaskStatus(id, status as Status);

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: updated, message: `Status updated to ${status}` });
  } catch {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
