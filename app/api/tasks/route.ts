import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import type { Filter } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { TaskModel, ITask } from '@/models/Task';
import { AssigneeModel } from '@/models/Assignee';
import { taskSchema } from '@/lib/validations/task';
import { Task } from '@/types';


export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build MongoDB Query Filter using MongoDB Filter interface
    const filter: Filter<ITask> = {};

    // Filter by Status
    if (status && status !== 'all') {
      filter.status = status as ITask['status'];
    }

    // Filter by Priority
    if (priority && priority !== 'all') {
      filter.priority = priority as ITask['priority'];
    }

    // Filter by Assignee
    if (assigneeId && assigneeId !== 'all') {
      if (assigneeId === 'unassigned') {
        filter.$or = [{ assigneeId: null }, { assigneeId: { $exists: false } }] as Filter<ITask>[];
      } else if (mongoose.Types.ObjectId.isValid(assigneeId)) {
        filter.assigneeId = assigneeId as any;
      }
    }

    // Filter by Search Query (Title, Description, or Assignee Name matching)
    if (search) {
      const matchingAssignees = await AssigneeModel.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');

      const assigneeIds = matchingAssignees.map((a) => a._id);

      const searchConditions: Filter<ITask>[] = [
        { title: { $regex: search, $options: 'i' } } as Filter<ITask>,
        { description: { $regex: search, $options: 'i' } } as Filter<ITask>,
      ];

      if (assigneeIds.length > 0) {
        searchConditions.push({ assigneeId: { $in: assigneeIds } } as Filter<ITask>);
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }] as Filter<ITask>[];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Define Sorting Logic
    let sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === 'dueDate') {
      sortOptions = { dueDate: sortOrder };
    } else if (sortBy === 'title') {
      sortOptions = { title: sortOrder };
    } else if (sortBy === 'priority') {
      sortOptions = { priority: sortOrder };
    } else {
      sortOptions = { createdAt: sortOrder };
    }

    // Fetch tasks populated with assignee details
    const tasks = await TaskModel.find(filter)
      .populate('assigneeId', 'name email avatarColor role')
      .sort(sortOptions)
      .lean();

    // Transform tasks to attach populated assigneeId data to assignee key
    const formattedTasks = tasks.map((task: Task) => {
      const { assigneeId, ...rest } = task;
      return {
        ...rest,
        assigneeId: task.assigneeId || assigneeId || null,
        assignee: assigneeId || null,
      };
    });

    return NextResponse.json({ tasks: formattedTasks, total: formattedTasks.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Input Validation
    const validation = taskSchema.safeParse(body);
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

    const { title, description, assigneeId, priority, status, dueDate } = validation.data;

    await connectToDatabase();

    // 2. Validate Assignee ID if provided
    let validAssigneeId = null;
    if (assigneeId) {
      if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
        return NextResponse.json(
          { errors: { assigneeId: 'Invalid Assignee ID format.' } },
          { status: 400 }
        );
      }
      const assigneeExists = await AssigneeModel.exists({ _id: assigneeId });
      if (!assigneeExists) {
        return NextResponse.json(
          { errors: { assigneeId: 'Assignee not found.' } },
          { status: 400 }
        );
      }
      validAssigneeId = assigneeId;
    }

    // 3. Create Task with Initial Logged Activity
    const newTask = await TaskModel.create({
      title,
      description,
      assigneeId: validAssigneeId,
      priority,
      status,
      dueDate: new Date(dueDate),
      activities: [
        {
          action: 'created',
          user: 'Admin',
          details: 'Task was created',
          timestamp: new Date(),
        },
      ],
    });

    const populatedTask = await TaskModel.findById(newTask._id)
      .populate('assigneeId', 'name email avatarColor role')
      .lean();

    return NextResponse.json(
      { task: populatedTask, message: 'Task created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}