import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGoalClaim extends Document {
  goal: Types.ObjectId;
  user: Types.ObjectId;
  pointsAwarded: number;
  claimedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const goalClaimSchema: Schema = new Schema(
  {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pointsAwarded: {
      type: Number,
      required: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

goalClaimSchema.index({ goal: 1, user: 1 }, { unique: true });

goalClaimSchema.index({ user: 1, claimedAt: -1 });

export default mongoose.model<IGoalClaim>('GoalClaim', goalClaimSchema);
