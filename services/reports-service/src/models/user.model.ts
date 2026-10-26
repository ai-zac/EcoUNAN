import mongoose, { Document, Schema } from 'mongoose';

/**
 * Copia de SOLO LECTURA del modelo User del backend principal.
 * El microservicio de reportes nunca crea ni modifica usuarios; solo los
 * consulta para validar el JWT y para cruzar datos (name, faculty, career).
 * Si cambias el esquema en backend/src/models/user.model.ts, sincroniza aquí.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  role: 'user' | 'brigadista' | 'admin' | 'superadmin';
  isActive: boolean;
  ecoPoints: number;
  lifetimePoints: number;
  faculty?: string;
  career?: string;
  studentId?: string;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['user', 'brigadista', 'admin', 'superadmin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    ecoPoints: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    faculty: { type: String },
    career: { type: String },
    studentId: { type: String },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    // No crear índices desde el microservicio: el backend principal es el dueño del esquema.
    autoIndex: false,
  },
);

export default mongoose.model<IUser>('User', userSchema);

