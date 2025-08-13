import { esClient } from "../server";
const INDEX = "posts";
export async function indexPost(post) {
    await esClient.index({
        index: INDEX,
        id: post._id?.toString(),
        body: {
            title: post.title,
            text: post.text,
            picture: post.picture,
            likesCount: post.likes.length,
            commentsCount: post.comments.length,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        },
    });
    await esClient.indices.refresh({ index: INDEX });
}
export async function updatePostInIndex(post) {
    await esClient.update({
        index: INDEX,
        id: post._id.toString(),
        body: {
            title: post.title,
            text: post.text,
            picture: post.picture,
            likesCount: post.likes.length,
            commentsCount: post.comments.length,
            updatedAt: post.updatedAt,
        },
    });
    await esClient.indices.refresh({ index: INDEX });
}
export async function deletePostFromIndex(postId) {
    await esClient.delete({
        index: INDEX,
        id: postId,
    });
    await esClient.indices.refresh({ index: INDEX });
}
export async function searchPosts(query) {
    const result = await esClient.search({
        index: INDEX,
        body: {
            multi_match: {
                query,
                fields: ["title", "text"],
                fuzziness: "AUTO",
            },
        },
    });
    return result.hits.hits.map((hit) => ({
        id: hit._id,
        ...(typeof hit._source === "object" && hit._source !== null
            ? hit._source
            : {}),
    }));
}
