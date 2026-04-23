import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetId: mongoose.Types.ObjectId;
  targetType: 'User' | 'Campaign' | 'CampaignOwnerRequest';
  notes?: string;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Campaign', 'CampaignOwnerRequest'],
      required: true,
    },
    notes: { type: String },
    ipAddress: { type: String },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false },
    // These logs are immutable. No updates allowed.
  }
);

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
