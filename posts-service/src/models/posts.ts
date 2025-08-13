import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  userId: Types.ObjectId;
  text: string;
  createdAt: Date;
  postId: Types.ObjectId;
  comments: Types.ObjectId[];
}

const CommentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comments" }],
});

export interface IPost extends Document {
  title: string;
  text: string;
  picture?: string;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  tags: Types.ObjectId[];
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    picture: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: "users" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comments" }],
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  },
  { timestamps: true }
);

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
export const Post = mongoose.model<IPost>("Post", PostSchema);
