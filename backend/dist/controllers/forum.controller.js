"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForumStatistics = exports.toggleCommentLike = exports.togglePostLike = exports.deleteForumComment = exports.updateForumComment = exports.createForumComment = exports.getForumComments = exports.deleteForumPost = exports.updateForumPost = exports.createForumPost = exports.getForumPostById = exports.getAllForumPosts = void 0;
const forumService = __importStar(require("../services/forum.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all forum posts
const getAllForumPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, category, authorId, isPinned } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        const result = yield forumService.getAllPosts({
            page: pageNum,
            limit: limitNum,
            search: search && search !== '' ? search : undefined,
            category: category && category !== '' ? category : undefined,
            authorId: authorId ? parseInt(authorId) : undefined,
            isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
        });
        res.status(200).json({
            status: 'success',
            results: result.posts.length,
            currentPage: pageNum,
            data: {
                posts: result.posts,
                pagination: result.pagination
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllForumPosts = getAllForumPosts;
// Get forum post by ID
const getForumPostById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        const post = yield forumService.getPostById(postId);
        res.status(200).json({
            status: 'success',
            data: {
                post,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getForumPostById = getForumPostById;
// Create forum post
const createForumPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const { title, content, category, isPinned, isLocked } = req.body;
        if (!title || !content || !category) {
            throw new error_middleware_1.ApiError('Title, content, and category are required', 400);
        }
        const newPost = yield forumService.createPost({
            title,
            content,
            category,
            isPinned: isPinned === true,
            isLocked: isLocked === true,
        }, req.user.id);
        res.status(201).json({
            status: 'success',
            message: 'Forum post created successfully',
            data: {
                post: newPost,
            },
        });
    }
    catch (error) {
        console.error('Error creating forum post:', error);
        // Handle specific ApiError
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
            });
        }
        next(error);
    }
});
exports.createForumPost = createForumPost;
// Update forum post
const updateForumPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        const postData = req.body;
        const updatedPost = yield forumService.updatePost(postId, postData, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Forum post updated successfully',
            data: {
                post: updatedPost,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateForumPost = updateForumPost;
// Delete forum post
const deleteForumPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        yield forumService.deletePost(postId, req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Forum post deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteForumPost = deleteForumPost;
// Get comments for a forum post
const getForumComments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        // Check if post exists
        const post = yield prisma.forumPost.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new error_middleware_1.ApiError('Forum post not found', 404);
        }
        // Get comments with pagination
        const skip = (pageNum - 1) * limitNum;
        // Get total count for pagination
        const total = yield prisma.forumComment.count({
            where: { postId },
        });
        // Get comments
        const comments = yield prisma.forumComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limitNum,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
        });
        res.status(200).json({
            status: 'success',
            results: comments.length,
            data: {
                comments,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getForumComments = getForumComments;
// Create comment on a forum post
const createForumComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        const { content } = req.body;
        if (!content) {
            throw new error_middleware_1.ApiError('Comment content is required', 400);
        }
        // Check if post exists
        const post = yield prisma.forumPost.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new error_middleware_1.ApiError('Forum post not found', 404);
        }
        // Check if post is locked
        if (post.isLocked) {
            throw new error_middleware_1.ApiError('This post is locked and cannot receive new comments', 403);
        }
        // Create comment
        const newComment = yield prisma.forumComment.create({
            data: {
                postId,
                authorId: req.user.id,
                content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
        res.status(201).json({
            status: 'success',
            message: 'Comment created successfully',
            data: {
                comment: newComment,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createForumComment = createForumComment;
// Update comment
const updateForumComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        const commentId = parseInt(req.params.commentId);
        if (isNaN(postId) || isNaN(commentId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        const { content } = req.body;
        if (!content) {
            throw new error_middleware_1.ApiError('Comment content is required', 400);
        }
        // Check if comment exists
        const comment = yield prisma.forumComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new error_middleware_1.ApiError('Comment not found', 404);
        }
        // Check if comment belongs to the post
        if (comment.postId !== postId) {
            throw new error_middleware_1.ApiError('Comment does not belong to this post', 400);
        }
        // Check if user is the author
        if (comment.authorId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to update this comment', 403);
        }
        // Update comment
        const updatedComment = yield prisma.forumComment.update({
            where: { id: commentId },
            data: { content },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Comment updated successfully',
            data: {
                comment: updatedComment,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateForumComment = updateForumComment;
// Delete comment
const deleteForumComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        const commentId = parseInt(req.params.commentId);
        if (isNaN(postId) || isNaN(commentId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        // Check if comment exists
        const comment = yield prisma.forumComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new error_middleware_1.ApiError('Comment not found', 404);
        }
        // Check if comment belongs to the post
        if (comment.postId !== postId) {
            throw new error_middleware_1.ApiError('Comment does not belong to this post', 400);
        }
        // Check if user is the author or has permission
        if (comment.authorId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
            throw new error_middleware_1.ApiError('You are not authorized to delete this comment', 403);
        }
        // Delete comment
        yield prisma.forumComment.delete({
            where: { id: commentId },
        });
        res.status(200).json({
            status: 'success',
            message: 'Comment deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteForumComment = deleteForumComment;
// Like/unlike a forum post
const togglePostLike = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            throw new error_middleware_1.ApiError('Invalid forum post ID', 400);
        }
        // Check if post exists
        const post = yield prisma.forumPost.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new error_middleware_1.ApiError('Forum post not found', 404);
        }
        // Check if user has already liked the post
        const existingLike = yield prisma.forumLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: req.user.id,
                },
            },
        });
        let liked = false;
        if (existingLike) {
            // Unlike the post
            yield prisma.forumLike.delete({
                where: {
                    id: existingLike.id,
                },
            });
        }
        else {
            // Like the post
            yield prisma.forumLike.create({
                data: {
                    postId,
                    userId: req.user.id,
                },
            });
            liked = true;
        }
        // Get updated like count
        const likeCount = yield prisma.forumLike.count({
            where: { postId },
        });
        res.status(200).json({
            status: 'success',
            message: liked ? 'Post liked successfully' : 'Post unliked successfully',
            data: {
                liked,
                likeCount,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.togglePostLike = togglePostLike;
// Like/unlike a comment
const toggleCommentLike = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const postId = parseInt(req.params.id);
        const commentId = parseInt(req.params.commentId);
        if (isNaN(postId) || isNaN(commentId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        // Check if comment exists
        const comment = yield prisma.forumComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new error_middleware_1.ApiError('Comment not found', 404);
        }
        // Check if comment belongs to the post
        if (comment.postId !== postId) {
            throw new error_middleware_1.ApiError('Comment does not belong to this post', 400);
        }
        // Check if user has already liked the comment
        const existingLike = yield prisma.forumCommentLike.findUnique({
            where: {
                commentId_userId: {
                    commentId,
                    userId: req.user.id,
                },
            },
        });
        let liked = false;
        if (existingLike) {
            // Unlike the comment
            yield prisma.forumCommentLike.delete({
                where: {
                    id: existingLike.id,
                },
            });
        }
        else {
            // Like the comment
            yield prisma.forumCommentLike.create({
                data: {
                    commentId,
                    userId: req.user.id,
                },
            });
            liked = true;
        }
        // Get updated like count
        const likeCount = yield prisma.forumCommentLike.count({
            where: { commentId },
        });
        res.status(200).json({
            status: 'success',
            message: liked ? 'Comment liked successfully' : 'Comment unliked successfully',
            data: {
                liked,
                likeCount,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.toggleCommentLike = toggleCommentLike;
// Get forum statistics
const getForumStatistics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Get statistics directly from the database
        const totalPosts = yield prisma.forumPost.count();
        const totalComments = yield prisma.forumComment.count();
        const totalLikes = yield prisma.forumLike.count();
        const announcements = yield prisma.forumPost.count({
            where: { category: 'PENGUMUMAN' },
        });
        const discussions = yield prisma.forumPost.count({
            where: { category: 'DISKUSI' },
        });
        const pinnedPosts = yield prisma.forumPost.count({
            where: { isPinned: true },
        });
        const lockedPosts = yield prisma.forumPost.count({
            where: { isLocked: true },
        });
        const statistics = {
            totalPosts,
            totalComments,
            totalLikes,
            announcements,
            discussions,
            pinnedPosts,
            lockedPosts,
        };
        res.status(200).json({
            status: 'success',
            data: {
                statistics,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getForumStatistics = getForumStatistics;
