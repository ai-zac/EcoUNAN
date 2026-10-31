import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Copia de SOLO LECTURA del modelo Recycle del backend principal
 * (backend/src/models/recycle.model.ts). Los datos de facultad/carrera NO
 * viven aquí: se obtienen del usuario vía $lookup a la colección 'users'.
 */
export type MaterialType = string;
export type RecycleStatus = 'pending' | 'validated' | 'rejected';

export interface IRecycle extends Document {
  user: Types.ObjectId;
  items: { materialType: MaterialType; weight: number; pointsEarned: number }[];
  totalWeight: number;
  totalPoints: number;
  status: RecycleStatus;
  validationMode?: 'photo' | 'inperson';
  validatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recycleSchema = new Schema<IRecycle>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    items: [
      {
        materialType: { type: String, required: true },
        weight: { type: Number, required: true },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    totalWeight: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'validated', 'rejected'], default: 'pending' },
    validationMode: { type: String, enum: ['photo', 'inperson'] },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    // Los índices los define y crea el backend principal.
    autoIndex: false,
  },
);

export default mongoose.model<IRecycle>('Recycle', recycleSchema);
