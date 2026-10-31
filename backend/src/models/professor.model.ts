import { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { studentConnection } from '../config/studentDb';

export interface IProfesor extends Document {
  nombre: string;
  usuario: string;
  password?: string;
  rol: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const profesorSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
    },
    usuario: {
      type: String,
      required: [true, 'El usuario o correo institucional es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false,
    },
    rol: {
      type: String,
      default: 'Docente / Administrador',
    },
  },
  {
    timestamps: true,
  }
);

profesorSchema.pre<IProfesor>('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

profesorSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Profesor = studentConnection.model<IProfesor>('Profesor', profesorSchema);
