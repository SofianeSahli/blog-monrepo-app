import mongoose from "mongoose";
import { Post } from "../models/posts";
import { esClient } from "../server";
const INDEX = "TAGS";
export async function indexPostById(postId: mongoose.Types.ObjectId) {
  const post = await Post.findById(postId)
    .populate("tags", "name -_id") // only take tag name
    .lean();

  if (!post) return;

  await esClient.index({
    index: INDEX,
    id: post._id.toString(),
    document: {
      title: post.title,
      text: post.text,
      picture: post.picture,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      userId: post.userId.toString(),

      // ✅ flatten tag names into array
      tags: post.tags.map((t: any) => t.name.toLowerCase()),
    },
  });

  await esClient.indices.refresh({ index: INDEX });
}
