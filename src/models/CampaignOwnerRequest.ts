import mongoose, { Document, Schema } from 'mongoose';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type PurposeCategory = 'startup' | 'medical' | 'education' | 'social' | 'technology' | 'personal';

export interface ICampaignOwnerRequest extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  country: string;
  
  // Identity (Secure image URLs)
  idType: 'passport' | 'nic' | 'driver_license';
  idFrontImage: string;
  idBackImage: string;
  selfieImage?: string;

  // Intent
  purposeCategory: PurposeCategory;
  profileHeadline: string;
  profileBio: string;
  
  // Web3
  walletAddress?: string;

  // Admin Review
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  
  submittedAt: Date;
  reviewedAt?: Date;
}

const campaignOwnerRequestSchema = new Schema<ICampaignOwnerRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    country: { type: String, required: true },
    
    idType: {
      type: String,
      enum: ['passport', 'nic', 'driver_license'],
      required: true,
    },
    idFrontImage: { type: String, required: true },
    idBackImage: { type: String, required: true },
    selfieImage: { type: String },

    purposeCategory: {
      type: String,
      enum: ['startup', 'medical', 'education', 'social', 'technology', 'personal'],
      required: true,
    },
    profileHeadline: { type: String, required: true },
    profileBio: { type: String, required: true },
    
    walletAddress: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: { type: String },

    reviewedAt: { type: Date },
  },
  { timestamps: { createdAt: 'submittedAt', updatedAt: true } }
);

const CampaignOwnerRequest = mongoose.model<ICampaignOwnerRequest>(
  'CampaignOwnerRequest',
  campaignOwnerRequestSchema
);

export default CampaignOwnerRequest;
