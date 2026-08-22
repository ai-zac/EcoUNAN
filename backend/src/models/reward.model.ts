import mongoose, { Document, Schema } from 'mongoose';

export interface IReward extends Document {
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  iconName: string;
  iconColor: string;
  iconBg: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema: Schema = new Schema(
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
    pointsCost: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    iconName: {
      type: String,
      default: 'Gift',
    },
    iconColor: {
      type: String,
      default: '#D97706',
    },
    iconBg: {
      type: String,
      default: '#FEF3C7',
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

export default mongoose.model<IReward>('Reward', rewardSchema);
