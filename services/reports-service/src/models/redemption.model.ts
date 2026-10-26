import mongoose, { Document, Schema, Types } from 'mongoose';

export type RedemptionStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Copia de SOLO LECTURA del modelo Redemption del backend principal.
 */
export interface IRedemption extends Document {
  user: Types.ObjectId;
  reward: Types.ObjectId;
  pointsSpent: number;
  status: RedemptionStatus;
  qrCodeData: string;
  validatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<IRedemption>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    reward: { type: Schema.Types.ObjectId, required: true, ref: 'Reward' },
    pointsSpent: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    qrCodeData: { type: String, required: true },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
);

export default mongoose.model<IRedemption>('Redemption', redemptionSchema);

