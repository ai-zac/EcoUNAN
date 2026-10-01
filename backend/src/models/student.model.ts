import { Schema, Document } from 'mongoose';
import { studentConnection } from '../config/studentDb';

export interface IEstudiante extends Document {
  nombre: string;
  apellido?: string;
  studentId?: string;
  faculty?: string;
  carrera: string;
  correo: string;
  telefono: string;
  fotoUrl?: string;
  semestre?: string;
  createdAt: Date;
  updatedAt: Date;
}

const estudianteSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellido: {
      type: String,
      trim: true,
      default: '',
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    faculty: {
      type: String,
      trim: true,
      default: 'Ciencia, Tecnología y Salud',
    },
    carrera: {
      type: String,
      required: [true, 'La carrera es obligatoria'],
      trim: true,
    },
    correo: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true,
    },
    fotoUrl: {
      type: String,
      default: '',
    },
    semestre: {
      type: String,
      default: 'I Semestre',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

estudianteSchema.index({ nombre: 1, apellido: 1 });
estudianteSchema.index({ studentId: 1 });
estudianteSchema.index({ faculty: 1 });
estudianteSchema.index({ carrera: 1 });
estudianteSchema.index({ createdAt: -1 });

export const Estudiante = studentConnection.model<IEstudiante>('Estudiante', estudianteSchema);
