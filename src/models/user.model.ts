import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'projectOwner' | 'contributor';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImage?: string;
  walletAddress?: string;
  isWalletConnected: boolean;
  accountStatus: AccountStatus;
  refreshToken: string | null;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'projectOwner', 'contributor'],
      default: 'contributor',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      lowercase: true,
      trim: true,
      index: { unique: true, sparse: true },
    },
    isWalletConnected: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'rejected'],
      default: 'active',
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// ── Pre-save: hash password if modified ──────────────────────────────────────
// Uses the plain (non-generic) pre hook to avoid mongoose 9 overload conflicts.
userSchema.pre('save', async function () {
  // `this` is the document being saved
  const doc = this as IUser;
  if (!doc.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  doc.password = await bcrypt.hash(doc.password, salt);
});

// ── Instance method: compare plain password with hashed ──────────────────────
userSchema.methods['comparePassword'] = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
