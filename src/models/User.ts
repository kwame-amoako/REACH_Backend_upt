import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  balance: number;
  isVerified: boolean;
  role: "user" | "admin";

  // OTP fields
  otpCode?: string; // last generated OTP
  otpRequestId?: string; // BulkClix requestId
  otpExpiresAt?: Date; // expiration time
  otpAttempts: number; // number of attempts
  lastOtpSentAt?: Date; // for resend cooldown
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone: { type: String },
    balance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "user", enum: ["user", "admin"] },

    // OTP fields
    otpCode: { type: String },
    otpRequestId: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
