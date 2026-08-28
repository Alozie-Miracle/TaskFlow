import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { TaskModel } from '@/models/Task';
import { updateTaskStatusSchema } from '@/lib/validations/task';

// PATCH /api/tasks/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Validate Mongo ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Task ID format.' }, { status: 400 });
    }

    const body = await req.json();

    // 2. Validate request payload using Zod
    const validation = updateTaskStatusSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || 'Valid status is required.' },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    await connectToDatabase();

    // 3. Update task status and record activity log
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: {
          activities: {
            action: 'status_change',
            user: 'Admin',
            details: `Status updated to ${status}`,
            timestamp: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate('assigneeId', 'name email avatarColor role')
      .lean();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      task: updatedTask,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}