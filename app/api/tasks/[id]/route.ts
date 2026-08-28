import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { TaskModel } from '@/models/Task';
import { updateTaskSchema } from '@/lib/validations/task';
import { verifyToken } from '@/lib/jwt';

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

    const task: any = await TaskModel.findById(id)
      .populate('assigneeId', 'name email avatarColor role')
      .lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Transform single task document
    const { assigneeId, ...rest } = task;
    const formattedTask = {
      ...rest,
      assigneeId: assigneeId?._id || assigneeId || null,
      assignee: assigneeId || null,
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error(error);
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

    // 1. Authenticate user from cookie
    const token = req.cookies.get('admin_token')?.value;
    const decodedUser = token ? verifyToken(token) : null;
    const actorName = decodedUser?.email ? decodedUser.email.split('@')[0] : 'Admin';

    const body = await req.json();
    const { newNote, ...taskUpdateFields } = body;

    // 2. Validate update data if other fields are present
    let updateData = taskUpdateFields;
    if (Object.keys(taskUpdateFields).length > 0) {
      const validation = updateTaskSchema.safeParse(taskUpdateFields);
      if (!validation.success) {
        const errors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const path = issue.path[0];
          if (path) acc[path.toString()] = issue.message;
          return acc;
        }, {});
        return NextResponse.json({ errors }, { status: 400 });
      }
      updateData = validation.data;
    }

    await connectToDatabase();

    // 3. Construct update query dynamically
    const updateQuery: Record<string, any> = {};

    if (Object.keys(updateData).length > 0) {
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      updateQuery.$set = updateData;
    }

    // 4. Push activity log directly on MongoDB
    const newActivity = newNote
      ? {
          action: 'Note Added',
          user: actorName,
          details: newNote.trim(),
          timestamp: new Date(),
        }
      : {
          action: 'Task Updated',
          user: actorName,
          details: 'Task details updated',
          timestamp: new Date(),
        };

    updateQuery.$push = { activities: newActivity };

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      updateQuery,
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
    console.error('Error updating task:', error);
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