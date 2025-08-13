import mongoose, { Schema } from "mongoose";
import { IPost } from "./posts";

export interface ITag extends Document {
  name: string;
  description?: string;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: { type: String },
});

export const Tag = mongoose.model<ITag>("Tag", TagSchema);
