import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  description: string;
  targetRecycles: number;
  rewardPoints: number;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetRecycles: {
      type: Number,
      required: true,
    },
    rewardPoints: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGoal>('Goal', goalSchema);
