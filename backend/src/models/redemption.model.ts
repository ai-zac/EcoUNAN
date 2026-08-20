import mongoose, { Document, Schema } from 'mongoose';

export interface IRedemption extends Document {
  user: mongoose.Schema.Types.ObjectId;
  reward: mongoose.Schema.Types.ObjectId;
  pointsSpent: number;
  status: 'pending' | 'completed' | 'cancelled';
  qrCodeData: string;
  validatedBy?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Reward',
    },
    pointsSpent: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    qrCodeData: {
      type: String,
      required: true,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

redemptionSchema.index({ qrCodeData: 1 }, { unique: true });
redemptionSchema.index({ status: 1, createdAt: -1 });
redemptionSchema.index({ user: 1, createdAt: -1 });
redemptionSchema.index({ reward: 1, status: 1 });
redemptionSchema.index({ validatedBy: 1, createdAt: -1 });

export default mongoose.model<IRedemption>('Redemption', redemptionSchema);
