import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AssigneeModel } from '@/models/Assignee';
import '@/models/Task'; // Ensure Task model is registered for aggregate pipelines
import { assigneeSchema } from '@/lib/validations/assignee';

export async function GET() {
  try {
    await connectToDatabase();

    // MongoDB Aggregation to attach computed task metrics directly in the DB
    const assigneesWithMetrics = await AssigneeModel.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assigneeId',
          as: 'assignedTasks',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          department: 1,
          avatarColor: 1,
          createdAt: 1,
          updatedAt: 1,
          taskCount: { $size: '$assignedTasks' },
          activeTasks: {
            $size: {
              $filter: {
                input: '$assignedTasks',
                as: 'task',
                cond: { $ne: ['$$task.status', 'Completed'] },
              },
            },
          },
          completedTasks: {
            $size: {
              $filter: {
                input: '$assignedTasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'Completed'] },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json({ assignees: assigneesWithMetrics });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve assignees.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod input validation
    const validation = assigneeSchema.safeParse(body);
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

    const { name, email, role, department, avatarColor } = validation.data;

    await connectToDatabase();

    // 2. Check duplicate email in MongoDB
    const existingAssignee = await AssigneeModel.findOne({ email });
    if (existingAssignee) {
      return NextResponse.json(
        { errors: { email: 'An assignee with this email already exists.' } },
        { status: 400 }
      );
    }

    // 3. Create Assignee
    const newAssignee = await AssigneeModel.create({
      name,
      email,
      role,
      department,
      avatarColor,
    });

    return NextResponse.json(
      { assignee: newAssignee, message: 'Assignee created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create assignee.' },
      { status: 500 }
    );
  }
}