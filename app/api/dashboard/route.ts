import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { TaskModel } from '@/models/Task';
import { AssigneeModel } from '@/models/Assignee';

export async function GET() {
  try {
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Parallel Database Execution for Base Metrics & Tasks
    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalAssignees,
      overdueTasks,
      upcomingTasks,
      recentTasks,
      assigneeWorkload,
      activityTasks,
    ] = await Promise.all([
      // Quick Count Metrics
      TaskModel.countDocuments(),
      TaskModel.countDocuments({ status: 'Todo' }),
      TaskModel.countDocuments({ status: 'In Progress' }),
      TaskModel.countDocuments({ status: 'Completed' }),
      AssigneeModel.countDocuments(),

      // Overdue Tasks (Not completed and due date before today)
      TaskModel.find({
        status: { $ne: 'Completed' },
        dueDate: { $lt: startOfToday },
      })
        .populate('assigneeId', 'name email avatarColor role')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),

      // Upcoming Tasks (Not completed and due date today or later)
      TaskModel.find({
        status: { $ne: 'Completed' },
        dueDate: { $gte: startOfToday },
      })
        .populate('assigneeId', 'name email avatarColor role')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),

      // Recent Tasks listing for Dashboard Overview
      TaskModel.find()
        .populate('assigneeId', 'name email avatarColor role')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // Assignee Workload Breakdown using Aggregation Pipeline
      AssigneeModel.aggregate([
        {
          $lookup: {
            from: 'tasks',
            localField: '_id',
            foreignField: 'assigneeId',
            as: 'userTasks',
          },
        },
        {
          $project: {
            id: '$_id',
            name: 1,
            role: 1,
            avatarColor: 1,
            total: { $size: '$userTasks' },
            todo: {
              $size: {
                $filter: {
                  input: '$userTasks',
                  as: 't',
                  cond: { $eq: ['$$t.status', 'Todo'] },
                },
              },
            },
            inProgress: {
              $size: {
                $filter: {
                  input: '$userTasks',
                  as: 't',
                  cond: { $eq: ['$$t.status', 'In Progress'] },
                },
              },
            },
            completed: {
              $size: {
                $filter: {
                  input: '$userTasks',
                  as: 't',
                  cond: { $eq: ['$$t.status', 'Completed'] },
                },
              },
            },
          },
        },
      ]),

      // Fetch Tasks containing activity subdocuments
      TaskModel.find({ 'activities.0': { $exists: true } })
        .select('title priority status activities')
        .lean(),
    ]);

    // 2. Format Dashboard Statistics Object
    const stats = {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalAssignees,
      overdueCount: overdueTasks.length,
    };

    // 3. Flatten and Sort Activity History Stream
    const activities: Array<{
      id: string;
      taskId: string;
      taskTitle: string;
      timestamp: Date;
      action: string;
      user: string;
      details?: string;
      priority: string;
      status: string;
    }> = [];

    activityTasks.forEach((task: any) => {
      if (task.activities && Array.isArray(task.activities)) {
        task.activities.forEach((act: any) => {
          activities.push({
            id: act._id ? act._id.toString() : act.id,
            taskId: task._id.toString(),
            taskTitle: task.title,
            timestamp: act.timestamp || act.createdAt,
            action: act.action,
            user: act.user,
            details: act.details,
            priority: task.priority,
            status: task.status,
          });
        });
      }
    });

    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const recentActivities = activities.slice(0, 7);

    return NextResponse.json({
      stats,
      overdueTasks,
      upcomingTasks,
      recentActivities,
      assigneeWorkload,
      recentTasks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate dashboard statistics.' },
      { status: 500 }
    );
  }
}