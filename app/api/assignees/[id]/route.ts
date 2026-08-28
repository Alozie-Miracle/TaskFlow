import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { AssigneeModel } from '@/models/Assignee';
import { TaskModel } from '@/models/Task';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Assignee ID format.' }, { status: 400 });
    }

    await connectToDatabase();

    const assignee = await AssigneeModel.findById(id).lean();

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found.' }, { status: 404 });
    }

    // Retrieve tasks associated with this assignee
    const tasks = await TaskModel.find({ assigneeId: id }).sort({ createdAt: -1 }).lean();

    const activeTasks = tasks.filter((t) => t.status !== 'Completed').length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

    return NextResponse.json({
      assignee: {
        ...assignee,
        taskCount: tasks.length,
        activeTasks,
        completedTasks,
      },
      tasks,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve assignee details.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Assignee ID format.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, role, department, avatarColor } = body;

    const errors: Record<string, string> = {};

    if (name !== undefined && !name.trim()) {
      errors.name = 'Full name cannot be empty.';
    }
    
    await connectToDatabase();

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errors.email = 'Valid email is required.';
      } else {
        const existing = await AssigneeModel.findOne({
          email: cleanEmail,
          _id: { $ne: id },
        });

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

    const updateFields: Record<string, any> = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (role !== undefined) updateFields.role = role.trim();
    if (department !== undefined) updateFields.department = department.trim();
    if (avatarColor !== undefined) updateFields.avatarColor = avatarColor;

    const updatedAssignee = await AssigneeModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedAssignee) {
      return NextResponse.json({ error: 'Assignee not found.' }, { status: 404 });
    }

    return NextResponse.json({
      assignee: updatedAssignee,
      message: 'Assignee updated successfully.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignee.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Assignee ID format.' }, { status: 400 });
    }

    await connectToDatabase();

    const deletedAssignee = await AssigneeModel.findByIdAndDelete(id);

    if (!deletedAssignee) {
      return NextResponse.json({ error: 'Assignee not found.' }, { status: 404 });
    }

    // Cascade: Unassign tasks linked to this assignee
    const updateResult = await TaskModel.updateMany(
      { assigneeId: id },
      { $unset: { assigneeId: '' } }
    );

    return NextResponse.json({
      success: true,
      unassignedTasksCount: updateResult.modifiedCount,
      message: `Assignee deleted successfully. ${updateResult.modifiedCount} task(s) unassigned.`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete assignee.' }, { status: 500 });
  }
}