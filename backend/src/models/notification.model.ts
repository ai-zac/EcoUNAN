import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  user?: Types.ObjectId | null;
  title: string;
  message: string;
  isRead: boolean;
  isBroadcast?: boolean;
  readBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<INotification>('Notification', notificationSchema);
