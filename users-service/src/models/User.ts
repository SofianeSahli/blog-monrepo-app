import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  email: string;
  password?: string;
  roles: String;
  firstName: string;
  lastName: string;
  profilePicture?: string;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: String,
    profilePicture: String, // Path to file

    lastName: String,
    password: { type: String, required: true },
    roles: {
      type: String,
      default: "reader",
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(this.password!, saltRounds);
    this.password = hashed;
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
