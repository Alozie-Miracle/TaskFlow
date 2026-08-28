import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters.').trim(),
  description: z.string().min(1, 'Task description is required.').trim(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High'], {
    message: 'Valid priority (Low, Medium, High) is required.',
  }),
  status: z.enum(['Todo', 'In Progress', 'Completed'], {
    message: 'Valid status (Todo, In Progress, Completed) is required.',
  }),
  dueDate: z.string().min(1, 'Valid due date is required.'),
});

export const updateTaskSchema = taskSchema.partial();

// Dedicated schema for updating just task status (e.g., Kanban drag-and-drop)
export const updateTaskStatusSchema = z.object({
  status: taskSchema.shape.status,
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;