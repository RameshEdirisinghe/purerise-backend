import mongoose, { Document, Schema } from 'mongoose';

export type ActivityType = 'viewed' | 'liked' | 'shared' | 'followed';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  actionType: ActivityType;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['viewed', 'liked', 'shared', 'followed'],
      required: true,
    },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false },
    // Compound index for calculations (e.g., getting total likes on a campaign)
    // and for ensuring high-performance activity streams.
  }
);

activitySchema.index({ campaignId: 1, actionType: 1 });
activitySchema.index({ userId: 1, actionType: 1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
