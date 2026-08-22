import mongoose, { Document, Schema } from 'mongoose';

export interface ICampusBin extends Document {
  name: string;
  locationDescription: string;
  binType: 'plastic' | 'metal' | 'paper' | 'mixed';
  qrCode: string;
  status: 'active' | 'full' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const campusBinSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    locationDescription: {
      type: String,
      required: true,
    },
    binType: {
      type: String,
      enum: ['plastic', 'metal', 'paper', 'mixed'],
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'full', 'maintenance'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICampusBin>('CampusBin', campusBinSchema);
