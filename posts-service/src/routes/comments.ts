// src/routes/comment.router.ts
import { Router } from "express";
import { Types } from "mongoose";
import {
  indexComment,
  updateCommentInES,
  deleteCommentFromES,
  searchComments,
} from "../config/comments-es-setup";
import { Comment, Post } from "../models/posts";
import { updatePostInIndex } from "../config/elastic-search-setup";
import { User } from "../models/User";

export const commentRouter = Router();

// CREATE comment
commentRouter.post(
  process.env.COMMENT_ROUTE || "/comments",
  async (req, res) => {
    try {
      const { userId, text, postId, parentCommentId } = req.body;

      if (!userId || !text || !postId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const comment = new Comment({
        userId: new Types.ObjectId(userId),
        text,
        comments: [],
      });
      await comment.save();
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $push: { comments: comment._id },
        });

        // Fetch the post document to pass to ES update function
        const post = await Post.findById(postId).lean();
        if (post) {
          await updatePostInIndex(post);
        }
      } else {
        await Post.findByIdAndUpdate(postId, {
          $push: { comments: comment._id },
        });

        // Fetch the post document to pass to ES update function
        const post = await Post.findById(postId).lean();
        if (post) {
          await updatePostInIndex(post);
        }
      }
      // Index in Elasticsearch
      await indexComment(comment);
      const user = await User.findById(userId)
        .select("firstName lastName profilePicture")
        .lean();

      res.status(201).json({
        ...comment.toObject(),
        parentCommentId: parentCommentId || null,
        postId,
        user: user || null,
      });
    } catch (err) {
      console.error("Error creating comment:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// READ comment by ID
commentRouter.get(
  process.env.COMMENT_ROUTE + "/:id" || "/comments/:id",
  async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.id)
        .populate("userId", "name")
        .populate("comments");
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });
      res.json(comment);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// SEARCH comments in Elasticsearch
commentRouter.get(process.env.COMMENT_ROUTE + "/search", async (req, res) => {
  try {
    const query = req.query.q as string;

    const results = await searchComments(req.params.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE comment
commentRouter.put(
  process.env.COMMENT_ROUTE + "/:id" || "/comments/:id",
  async (req, res) => {
    try {
      const { text } = req.body;
      const comment = await Comment.findByIdAndUpdate(
        req.params.id,
        { text },
        { new: true }
      );
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });

      await updateCommentInES(comment);
      res.json(comment);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE comment
commentRouter.delete(
  process.env.COMMENT_ROUTE + "/:id" || "/comments/:id",
  async (req, res) => {
    try {
      const comment = await Comment.findByIdAndDelete(req.params.id);
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });

      await deleteCommentFromES(req.params.id);
      res.json({ message: "Comment deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);
