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
exports.toggleLockPost = exports.togglePinPost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getAllPosts = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const notificationService = __importStar(require("./notification.service"));
const prisma = new client_1.PrismaClient();
// Get all forum posts with filtering
const getAllPosts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (params = {}) {
    const { page = 1, limit = 10, search, category, authorId, isPinned } = params;
    const skip = (page - 1) * limit;
    // Build where conditions
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { content: { contains: search } },
        ];
    }
    if (category) {
        where.category = category;
    }
    if (authorId) {
        where.authorId = authorId;
    }
    if (isPinned !== undefined) {
        where.isPinned = isPinned;
    }
    // Get total count for pagination
    const total = yield prisma.forumPost.count({ where });
    // Get posts
    const posts = yield prisma.forumPost.findMany({
        where,
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
        ],
        skip,
        take: limit,
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
                    comments: true,
                    likes: true,
                },
            },
        },
    });
    return {
        posts,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllPosts = getAllPosts;
// Get post by ID
const getPostById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield prisma.forumPost.findUnique({
        where: { id },
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
                    comments: true,
                    likes: true,
                },
            },
        },
    });
    if (!post) {
        throw new error_middleware_1.ApiError('Post not found', 404);
    }
    return post;
});
exports.getPostById = getPostById;
// Create new post
const createPost = (data, authorId) => __awaiter(void 0, void 0, void 0, function* () {
    // Create post
    const post = yield prisma.forumPost.create({
        data: Object.assign(Object.assign({}, data), { authorId }),
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
    // If this is an announcement, create notifications for users
    if (data.category === 'PENGUMUMAN') {
        // Get all users except the author
        const users = yield prisma.user.findMany({
            where: {
                id: { not: authorId },
            },
            select: {
                id: true,
            },
        });
        const userIds = users.map(user => user.id);
        // Create notification for all users
        yield notificationService.createNotificationForUsers(userIds, {
            type: 'FORUM',
            title: 'Pengumuman RW',
            message: data.title,
            priority: data.isPinned ? 'HIGH' : 'NORMAL',
            forumPostId: post.id,
            data: {
                postTitle: data.title,
                postCategory: data.category,
                authorName: post.author.name,
                authorRole: post.author.role,
            },
        });
    }
    return post;
});
exports.createPost = createPost;
// Update post
const updatePost = (id, data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if post exists
    const existingPost = yield prisma.forumPost.findUnique({
        where: { id },
        include: {
            author: true,
        },
    });
    if (!existingPost) {
        throw new error_middleware_1.ApiError('Post not found', 404);
    }
    // Check if user is the author or has permission
    if (existingPost.authorId !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to update this post', 403);
    }
    // Update post
    const updatedPost = yield prisma.forumPost.update({
        where: { id },
        data,
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
    // If this is an announcement and was updated, update notifications
    if (data.category === 'PENGUMUMAN' || existingPost.category === 'PENGUMUMAN') {
        // Get all users except the author
        const users = yield prisma.user.findMany({
            where: {
                id: { not: userId },
            },
            select: {
                id: true,
            },
        });
        const userIds = users.map(user => user.id);
        // Create notification for all users about the update
        yield notificationService.createNotificationForUsers(userIds, {
            type: 'FORUM',
            title: 'Pengumuman RW Diperbarui',
            message: data.title || existingPost.title,
            priority: (data.isPinned !== undefined ? data.isPinned : existingPost.isPinned) ? 'HIGH' : 'NORMAL',
            forumPostId: id,
            data: {
                postTitle: data.title || existingPost.title,
                postCategory: data.category || existingPost.category,
                authorName: existingPost.author.name,
                authorRole: existingPost.author.role,
                isUpdate: true,
            },
        });
    }
    return updatedPost;
});
exports.updatePost = updatePost;
// Delete post
const deletePost = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if post exists
    const post = yield prisma.forumPost.findUnique({
        where: { id },
    });
    if (!post) {
        throw new error_middleware_1.ApiError('Post not found', 404);
    }
    // Check if user is the author or has permission
    if (post.authorId !== userId) {
        throw new error_middleware_1.ApiError('You do not have permission to delete this post', 403);
    }
    // Delete post
    yield prisma.forumPost.delete({
        where: { id },
    });
    return true;
});
exports.deletePost = deletePost;
// Toggle pin post
const togglePinPost = (id, isPinned, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if post exists
    const post = yield prisma.forumPost.findUnique({
        where: { id },
    });
    if (!post) {
        throw new error_middleware_1.ApiError('Post not found', 404);
    }
    // Update post
    const updatedPost = yield prisma.forumPost.update({
        where: { id },
        data: { isPinned },
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
    // If this is an announcement and was pinned, create notifications
    if (post.category === 'PENGUMUMAN' && isPinned && !post.isPinned) {
        // Get all users except the author
        const users = yield prisma.user.findMany({
            where: {
                id: { not: post.authorId },
            },
            select: {
                id: true,
            },
        });
        const userIds = users.map(user => user.id);
        // Create notification for all users
        yield notificationService.createNotificationForUsers(userIds, {
            type: 'FORUM',
            title: 'Pengumuman RW Penting',
            message: post.title,
            priority: 'HIGH',
            forumPostId: id,
            data: {
                postTitle: post.title,
                postCategory: post.category,
                authorName: updatedPost.author.name,
                authorRole: updatedPost.author.role,
                isPinned: true,
            },
        });
    }
    return updatedPost;
});
exports.togglePinPost = togglePinPost;
// Toggle lock post
const toggleLockPost = (id, isLocked, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if post exists
    const post = yield prisma.forumPost.findUnique({
        where: { id },
    });
    if (!post) {
        throw new error_middleware_1.ApiError('Post not found', 404);
    }
    // Update post
    const updatedPost = yield prisma.forumPost.update({
        where: { id },
        data: { isLocked },
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
    return updatedPost;
});
exports.toggleLockPost = toggleLockPost;
