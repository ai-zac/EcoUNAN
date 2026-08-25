import mongoose, { Document, Schema } from 'mongoose';

export interface IRecycle extends Document {
  user: mongoose.Schema.Types.ObjectId;
  items: {
    materialType: 'pet' | 'aluminio' | 'papel' | 'carton' | 'plastico';
    weight: number;
    pointsEarned: number;
  }[];
  totalWeight: number;
  totalPoints: number;
  status: 'pending' | 'validated' | 'rejected';
  validationMode?: 'photo' | 'inperson';
  proofImage?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recycleSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [
      {
        materialType: {
          type: String,
          required: true,
          enum: ['pet', 'aluminio', 'papel', 'carton', 'plastico'],
        },
        weight: {
          type: Number,
          required: true,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        }
      }
    ],
    totalWeight: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'validated', 'rejected'],
      default: 'pending',
    },
    validationMode: {
      type: String,
      enum: ['photo', 'inperson'],
      default: 'photo',
    },
    proofImage: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRecycle>('Recycle', recycleSchema);
