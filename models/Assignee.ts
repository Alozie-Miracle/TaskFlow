import { Schema, model, models, Document } from 'mongoose';

export interface IAssignee extends Document {
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssigneeSchema = new Schema<IAssignee>(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role / Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'Engineering',
      trim: true,
    },
    avatarColor: {
      type: String,
      default: 'bg-indigo-500',
    },
  },
  {
    timestamps: true,
  }
);

export const AssigneeModel = models.Assignee || model<IAssignee>('Assignee', AssigneeSchema);