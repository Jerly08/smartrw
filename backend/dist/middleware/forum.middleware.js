"use strict";
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
exports.checkLikeAccess = exports.checkForumCommentAccess = exports.checkAnnouncementAccess = exports.checkForumPostAccess = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("./error.middleware");
const prisma = new client_1.PrismaClient();
// Check if user can access a forum post
const checkForumPostAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
            include: {
                author: {
                    select: {
                        id: true,
                        role: true,
                        resident: {
                            select: {
                                rtNumber: true,
                                rwNumber: true
                            }
                        }
                    }
                }
            }
        });
        if (!post) {
            throw new error_middleware_1.ApiError('Forum post not found', 404);
        }
        // For GET requests, all authenticated users can access
        if (req.method === 'GET') {
            return next();
        }
        // Admin and RW have full access to all posts
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Author can access their own post
        if (post.authorId === req.user.id) {
            return next();
        }
        // RT can moderate posts from their RT
        if (req.user.role === 'RT') {
            // Get RT's area
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id }
            });
            if (!rtResident) {
                throw new error_middleware_1.ApiError('RT profile not found', 404);
            }
            // Check if post author is from RT's area
            if (post.author.resident &&
                post.author.resident.rtNumber === rtResident.rtNumber &&
                post.author.resident.rwNumber === rtResident.rwNumber) {
                return next();
            }
        }
        throw new error_middleware_1.ApiError('You do not have permission to modify this post', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkForumPostAccess = checkForumPostAccess;
// Check if user can create an announcement
const checkAnnouncementAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // Only Admin and RW can create announcements
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        throw new error_middleware_1.ApiError('Only Admin and RW can create announcements', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkAnnouncementAccess = checkAnnouncementAccess;
// Check if user can access a forum comment
const checkForumCommentAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        const commentId = parseInt(req.params.commentId);
        if (isNaN(commentId)) {
            throw new error_middleware_1.ApiError('Invalid comment ID', 400);
        }
        // Check if comment exists
        const comment = yield prisma.forumComment.findUnique({
            where: { id: commentId },
            include: {
                author: {
                    select: {
                        id: true,
                        role: true,
                        resident: {
                            select: {
                                rtNumber: true,
                                rwNumber: true
                            }
                        }
                    }
                },
                post: {
                    select: {
                        id: true,
                        isLocked: true,
                        author: {
                            select: {
                                resident: {
                                    select: {
                                        rtNumber: true,
                                        rwNumber: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!comment) {
            throw new error_middleware_1.ApiError('Comment not found', 404);
        }
        // For GET requests, all authenticated users can access
        if (req.method === 'GET') {
            return next();
        }
        // Check if the post is locked
        if (comment.post.isLocked && req.method !== 'GET') {
            throw new error_middleware_1.ApiError('This post is locked and cannot be modified', 403);
        }
        // Admin and RW have full access to all comments
        if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
            return next();
        }
        // Author can access their own comment
        if (comment.authorId === req.user.id) {
            return next();
        }
        // RT can moderate comments from their RT
        if (req.user.role === 'RT') {
            // Get RT's area
            const rtResident = yield prisma.resident.findFirst({
                where: { userId: req.user.id }
            });
            if (!rtResident) {
                throw new error_middleware_1.ApiError('RT profile not found', 404);
            }
            // Check if comment author is from RT's area
            if (comment.author.resident &&
                comment.author.resident.rtNumber === rtResident.rtNumber &&
                comment.author.resident.rwNumber === rtResident.rwNumber) {
                return next();
            }
        }
        throw new error_middleware_1.ApiError('You do not have permission to modify this comment', 403);
    }
    catch (error) {
        next(error);
    }
});
exports.checkForumCommentAccess = checkForumCommentAccess;
// Check if user can like/unlike a post or comment
const checkLikeAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new error_middleware_1.ApiError('User not authenticated', 401);
        }
        // All authenticated users can like/unlike
        return next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkLikeAccess = checkLikeAccess;
