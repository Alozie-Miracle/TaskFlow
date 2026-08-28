import { Schema, model, models, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  assigneeId?: Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'Assignee', default: null },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Todo', 'In Progress', 'Completed'], default: 'Todo' },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const TaskModel = models.Task || model<ITask>('Task', TaskSchema);