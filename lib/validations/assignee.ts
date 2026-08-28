import { z } from 'zod';

export const assigneeSchema = z.object({
  name: z.string().min(1, 'Full name is required.').trim(),
  email: z.string().min(1, 'Email is required.').email('Please provide a valid email address.').toLowerCase().trim(),
  role: z.string().min(1, 'Role / Job title is required.').trim(),
  department: z.string().optional().default('General'),
  avatarColor: z.string().optional().default('bg-indigo-500'),
});

export type AssigneeInput = z.infer<typeof assigneeSchema>;