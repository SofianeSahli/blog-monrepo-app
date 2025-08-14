import mongoose, { Schema } from "mongoose";

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  postId: Schema.Types.ObjectId;
  type: Schema.Types.String;
  message: Schema.Types.String;
  timestamp: Schema.Types.Date;
  read: Schema.Types.Boolean;
}
const notificationSchema = new mongoose.Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  postId: { type: Schema.Types.ObjectId, required: true, ref: "Post" },
  type: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export const Notification = mongoose.model("Notification", notificationSchema);
