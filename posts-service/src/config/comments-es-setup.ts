// src/search/comment-es.ts
import { Client } from "@elastic/elasticsearch";
import { esClient } from "../server";
import { IComment } from "../models/posts";
const COMMENT_INDEX = "comments";
export async function indexComment(comment: IComment) {
  await esClient.index({
    index: COMMENT_INDEX,
    id: comment._id?.toString(),
    document: {
      userId: comment.userId.toString(),
      text: comment.text,
      createdAt: comment.createdAt,
      comments: comment.comments.map((id) => id.toString()),
      postId: comment.postId,
    },
  });
}

export async function updateCommentInES(comment: IComment) {
  await esClient.update({
    index: COMMENT_INDEX,
    id: comment._id!.toString(),
    doc: {
      text: comment.text,
      comments: comment.comments.map((id) => id.toString()),
      postId: comment.postId,
    },
  });
}

export async function deleteCommentFromES(commentId: string) {
  await esClient.delete({
    index: COMMENT_INDEX,
    id: commentId,
  });
}

export async function searchComments(query: string) {
  const { hits } = await esClient.search({
    index: COMMENT_INDEX,
    query: {
      match: {
        text: query,
      },
    },
  });
  return hits.hits.map((hit) => hit._source);
}
