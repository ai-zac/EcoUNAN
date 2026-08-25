import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'brigadista' | 'admin' | 'superadmin';
  isActive: boolean;
  ecoPoints: number;
  faculty?: string;
  career?: string;
  studentId?: string;
  profilePicture?: string;
  expoPushToken?: string;
  resetPasswordCodeHash?: string;
  resetPasswordExpires?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'brigadista', 'admin', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ecoPoints: {
      type: Number,
      default: 0,
    },
    faculty: {
      type: String,
      required: false,
    },
    career: {
      type: String,
      required: false,
    },
    studentId: {
      type: String,
      required: false,
    },
    profilePicture: {
      type: String,
      required: false,
    },
    expoPushToken: {
      type: String,
      required: false,
    },
    resetPasswordCodeHash: {
      type: String,
      required: false,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
