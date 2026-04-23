import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'campaign_update' | 'approval_status' | 'system_alert';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['campaign_update', 'approval_status', 'system_alert'],
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
