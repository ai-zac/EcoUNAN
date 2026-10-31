import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterial extends Document {
  name: string;
  key: string;
  pointsPerKg: number;
  unit: string;
  icon: string;
  color: string;
  bg: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    pointsPerKg: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true,
    },
    icon: {
      type: String,
      default: 'Recycle',
      trim: true,
    },
    color: {
      type: String,
      default: '#10B981',
      trim: true,
    },
    bg: {
      type: String,
      default: '#D1FAE5',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

materialSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IMaterial>('Material', materialSchema);
