import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';

interface IMilestone {
  title: string;
  description: string;
  fundPercentage: number;
  expectedCompletionDate: Date;
  status: 'pending' | 'completed';
}

export interface IContribution {
  walletAddress: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profileImage?: string;
  amountEth: string;
  txHash: string;
  timestamp: Date;
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
  contributions: IContribution[];

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
  fundPercentage: { type: Number, required: true },
  expectedCompletionDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
});

const contributionSchema = new Schema<IContribution>(
  {
    walletAddress: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    profileImage: { type: String },
    amountEth: { type: String, required: true },
    txHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    contributions: { type: [contributionSchema], default: [] },

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
