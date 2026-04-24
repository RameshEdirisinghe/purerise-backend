import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';

interface IMilestone {
  title: string;
  description: string;
  expectedCompletionDate: Date;
  status: 'pending' | 'completed';
}

export interface ICampaign extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  description: string;
  category: 'startup' | 'medical' | 'education' | 'social' | 'technology' | 'personal';
  coverImage: string;
  media: string[];
  
  goalDescription: string;
  targetFunding: number;
  endDate: Date;
  milestones: IMilestone[];
  
  status: CampaignStatus;
  approvedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  expectedCompletionDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
});

const campaignSchema = new Schema<ICampaign>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['startup', 'medical', 'education', 'social', 'technology', 'personal'],
      required: true,
      index: true,
    },
    coverImage: { type: String, required: true },
    media: [{ type: String }],
    
    goalDescription: { type: String, required: true },
    targetFunding: { type: Number, required: true },
    endDate: { type: Date, required: true },
    milestones: [milestoneSchema],
    
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected'],
      default: 'draft',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
