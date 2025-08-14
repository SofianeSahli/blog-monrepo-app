import { Types } from "mongoose";
import { Comment, IPost } from "../models/posts";
import { Tag } from "../models/tags";
import { User } from "../models/User";
import { esClient } from "../server";

const INDEX = "posts";

export async function indexPost(post: IPost) {
  // If tags are populated (objects), use their names
  // Otherwise, fallback to empty array or handle accordingly

  const tagNames = Array.isArray(post.tags)
    ? post.tags
        .map((t: any) =>
          typeof t === "object" && t !== null && "name" in t
            ? (t.name as string).toLowerCase()
            : null
        )
        .filter(Boolean)
    : [];

  await esClient.index({
    index: INDEX,
    id: post._id?.toString(),
    document: {
      title: post.title,
      text: post.text,
      picture: post.picture,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      userId: post.userId,
      updatedAt: post.updatedAt,
      tags: post.tags.map((t) => t.toString()), // Store IDs not names
      comments: post.comments.map((t) => t.toString()),
    },
  });
  await esClient.indices.refresh({ index: INDEX });
}
export async function updatePostInIndex(post: Partial<IPost>) {
  if (!post._id) {
    throw new Error("Missing post._id for Elasticsearch update");
  }

  await esClient.update({
    index: INDEX,
    id: post._id.toString(),
    doc: {
      title: post.title,
      text: post.text,
      picture: post.picture,
      userId: post.userId,
      likesCount: post?.likes?.length || 0,
      commentsCount: post?.comments?.length || 0,
      comments: Array.isArray(post.comments)
        ? post.comments.map((c) => (typeof c === "string" ? c : c.toString()))
        : [],
      tags: post.tags?.map((t) => t.toString()), // Store IDs not names

      updatedAt: post.updatedAt,
    },
  });

  await esClient.indices.refresh({ index: INDEX });
}

export async function deletePostFromIndex(postId: string) {
  await esClient.delete({
    index: INDEX,
    id: postId,
  });
  await esClient.indices.refresh({ index: INDEX });
}

export async function searchPosts(query: string) {
  const lowered = query.toLowerCase();

  const result = await esClient.search({
    index: INDEX,
    query: {
      bool: {
        should: [
          { wildcard: { title: `*${lowered}*` } },
          { wildcard: { text: `*${lowered}*` } },
          { wildcard: { tags: `*${lowered}*` } },
        ],
        minimum_should_match: 1,
      },
    },
  });
  const posts = result.hits.hits.map((hit) => ({
    id: hit._id,
    ...(hit._source as any),
  }));

  if (!posts.length) return [];
  return prepareForResponse(posts);
}
export async function getAll() {
  try {
    const result = await esClient.search({
      index: INDEX,
      query: { match_all: {} },
      size: 100,
    });

    const posts = result.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...(hit._source as any),
    }));

    return posts.length ? prepareForResponse(posts) : [];
  } catch (err: any) {
    if (
      err.meta?.body?.error?.type === "index_not_found_exception" ||
      err.statusCode === 404
    ) {
      return [];
    }

    throw err;
  }
}
// Basically avoid N+1 querries to ease on database and fetch faster on Bigger DB

const prepareForResponse = async (posts: IPost[]) => {
  const userIds = new Set<string>();
  const tagIds = new Set<string>();
  const commentIds = new Set<string>();
  for (const post of posts) {
    userIds.add(post.userId.toString());
    (post.tags || []).forEach((t) => tagIds.add(t.toString()));
    (post.comments || []).forEach((c) => commentIds.add(c.toString()));
  }
  const collectNestedCommentIds = async (ids: Set<string>) => {
    if (ids.size === 0) return;
    const objectIds = Array.from(ids).map((id) => new Types.ObjectId(id));
    const comments = await Comment.find({ _id: { $in: objectIds } })
      .select("comments")
      .lean();

    const newIds: string[] = [];
    for (const c of comments) {
      for (const nestedId of c.comments || []) {
        const strId = nestedId.toString();
        if (!commentIds.has(strId)) {
          commentIds.add(strId);
          newIds.push(strId);
        }
      }
    }
    if (newIds.length > 0) {
      await collectNestedCommentIds(new Set(newIds));
    }
  };

  await collectNestedCommentIds(commentIds);

  const allCommentObjectIds = Array.from(commentIds).map(
    (id) => new Types.ObjectId(id)
  );
  const allComments = await Comment.find({ _id: { $in: allCommentObjectIds } })
    .select("userId text createdAt comments")
    .lean();

  allComments.forEach((c) => userIds.add(c.userId.toString()));

  // Fetch all users and tags
  const [users, tags] = await Promise.all([
    User.find({
      _id: { $in: Array.from(userIds).map((id) => new Types.ObjectId(id)) },
    })
      .select("firstName lastName profilePicture")
      .lean(),
    Tag.find({
      _id: { $in: Array.from(tagIds).map((id) => new Types.ObjectId(id)) },
    })
      .select("name")
      .lean(),
  ]);

  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const tagMap = Object.fromEntries(tags.map((t) => [t._id.toString(), t]));
  const commentMap = Object.fromEntries(
    allComments.map((c: any) => [c._id.toString(), c])
  );

  const buildCommentTree = (commentId: string): any => {
    const comment = commentMap[commentId];
    if (!comment) return null;

    return {
      ...comment,
      user: userMap[comment.userId.toString()] || null,
      comments: (comment.comments || [])
        .map((childId: Types.ObjectId) => buildCommentTree(childId.toString()))
        .filter(Boolean),
    };
  };
  return posts
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((post) => ({
      ...post,
      user: userMap[post.userId.toString()] || null,
      tags: (post.tags || []).map((tagId) => tagMap[tagId.toString()] || null),
      comments: (post.comments || [])
        .map((commentId) => buildCommentTree(commentId.toString()))
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    }));
};
