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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const forumController = __importStar(require("../controllers/forum.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const forum_middleware_1 = require("../middleware/forum.middleware");
const forum_schema_1 = require("../schemas/forum.schema");
const router = express_1.default.Router();
// Get all forum posts
router.get('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(forum_schema_1.searchForumPostsSchema), forumController.getAllForumPosts);
// Get forum statistics
router.get('/statistics', auth_middleware_1.authenticate, forumController.getForumStatistics);
// Create forum post
router.post('/', auth_middleware_1.authenticate, 
// validateRequest(createForumPostSchema), // Temporarily disabled for debugging
forumController.createForumPost);
// Create announcement (only Admin and RW)
router.post('/announcements', auth_middleware_1.authenticate, forum_middleware_1.checkAnnouncementAccess, (0, validation_middleware_1.validateRequest)(forum_schema_1.createForumPostSchema), forumController.createForumPost);
// Get forum post by ID
router.get('/:id', auth_middleware_1.authenticate, forumController.getForumPostById);
// Update forum post
router.put('/:id', auth_middleware_1.authenticate, forum_middleware_1.checkForumPostAccess, (0, validation_middleware_1.validateRequest)(forum_schema_1.updateForumPostSchema), forumController.updateForumPost);
// Delete forum post
router.delete('/:id', auth_middleware_1.authenticate, forum_middleware_1.checkForumPostAccess, forumController.deleteForumPost);
// Get comments for a forum post
router.get('/:id/comments', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(forum_schema_1.searchForumCommentsSchema), forumController.getForumComments);
// Create comment on a forum post
router.post('/:id/comments', auth_middleware_1.authenticate, 
// validateRequest(createForumCommentSchema), // Temporarily disabled for debugging
forumController.createForumComment);
// Update comment
router.put('/:id/comments/:commentId', auth_middleware_1.authenticate, forum_middleware_1.checkForumCommentAccess, 
// validateRequest(updateForumCommentSchema), // Temporarily disabled for debugging
forumController.updateForumComment);
// Delete comment
router.delete('/:id/comments/:commentId', auth_middleware_1.authenticate, forum_middleware_1.checkForumCommentAccess, forumController.deleteForumComment);
// Like/unlike a forum post
router.post('/:id/like', auth_middleware_1.authenticate, forum_middleware_1.checkLikeAccess, forumController.togglePostLike);
// Like/unlike a comment
router.post('/:id/comments/:commentId/like', auth_middleware_1.authenticate, forum_middleware_1.checkLikeAccess, forumController.toggleCommentLike);
exports.default = router;
