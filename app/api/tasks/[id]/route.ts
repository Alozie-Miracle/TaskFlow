import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { TaskModel } from '@/models/Task';
import { AssigneeModel } from '@/models/Assignee';
import { updateTaskSchema } from '@/lib/validations/task';

// GET /api/tasks/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Task ID format.' }, { status: 400 });
    }

    await connectToDatabase();

    const task = await TaskModel.findById(id)
      .populate('assigneeId', 'name email avatarColor role')
      .lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT / PATCH /api/tasks/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Task ID format.' }, { status: 400 });
    }

    const body = await req.json();

    // 1. Zod Validation
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issue.path[0];
        if (path) {
          acc[path.toString()] = issue.message;
        }
        return acc;
      }, {});

      return NextResponse.json({ errors }, { status: 400 });
    }

    const updateData = validation.data;

    await connectToDatabase();

    // 2. Validate Assignee ID if provided
    if (updateData.assigneeId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.assigneeId)) {
        return NextResponse.json(
          { errors: { assigneeId: 'Invalid Assignee ID format.' } },
          { status: 400 }
        );
      }
      const assigneeExists = await AssigneeModel.exists({ _id: updateData.assigneeId });
      if (!assigneeExists) {
        return NextResponse.json(
          { errors: { assigneeId: 'Assignee not found.' } },
          { status: 400 }
        );
      }
    }

    // 3. Prepare payload & parse Date
    const payload: Record<string, any> = { ...updateData };
    if (updateData.dueDate) {
      payload.dueDate = new Date(updateData.dueDate);
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      {
        $set: payload,
        $push: {
          activities: {
            action: 'updated',
            user: 'Admin',
            details: 'Task details updated',
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
      message: 'Task updated successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Task ID format.' }, { status: 400 });
    }

    await connectToDatabase();

    const deletedTask = await TaskModel.findByIdAndDelete(id);

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}