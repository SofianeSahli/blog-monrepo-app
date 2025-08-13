import mongoose, { Schema } from "mongoose";
const CommentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});
const PostSchema = new Schema({
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    picture: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export const Comment = mongoose.model("Comment", CommentSchema);
export const Post = mongoose.model("Post", PostSchema);
