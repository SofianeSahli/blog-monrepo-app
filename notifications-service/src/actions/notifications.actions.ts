import { Notification } from "../models/notifications";
import { redisPub } from "../server";
import dotenv from "dotenv";

dotenv.config();
export const insertNotificaitons = async (args: any) => {
  {
    console.log(args);
    const notifications = [];
    if (args) {
      notifications.push({
        userId: args.userId,
        parentCommentOwnerId: args.parentCommentOwnerId,
        type: args.type,
        message: args.message,
        postId: args.postId,
      });
    }

    for (const n of notifications) {
      console.log(n);
      const savedNotifDoc = await Notification.create(n);
      const savedNotif = savedNotifDoc.toObject();
      await redisPub.publish(
        process.env.NOTIFICATIONS_READY_TO_DISPATCH ||
          "notifications_created_to_dispatch",
        JSON.stringify({
          ...savedNotif,
          id: savedNotif._id.toString(),
        })
      );
    }
  }
};
