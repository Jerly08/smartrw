import express from 'express';
import * as forumController from '../controllers/forum.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  checkForumPostAccess,
  checkAnnouncementAccess,
  checkForumCommentAccess,
  checkLikeAccess
} from '../middleware/forum.middleware';
import { 
  createForumPostSchema,
  updateForumPostSchema,
  createForumCommentSchema,
  updateForumCommentSchema,
  searchForumPostsSchema,
  searchForumCommentsSchema
} from '../schemas/forum.schema';

const router = express.Router();

// Get all forum posts
router.get(
  '/',
  authenticate,
  validateRequest(searchForumPostsSchema),
  forumController.getAllForumPosts
);

// Get forum statistics
router.get(
  '/statistics',
  authenticate,
  forumController.getForumStatistics
);

// Create forum post
router.post(
  '/',
  authenticate,
  validateRequest(createForumPostSchema),
  forumController.createForumPost
);

// Create announcement (only Admin and RW)
router.post(
  '/announcements',
  authenticate,
  checkAnnouncementAccess,
  validateRequest(createForumPostSchema),
  forumController.createForumPost
);

// Get forum post by ID
router.get(
  '/:id',
  authenticate,
  forumController.getForumPostById
);

// Update forum post
router.put(
  '/:id',
  authenticate,
  checkForumPostAccess,
  validateRequest(updateForumPostSchema),
  forumController.updateForumPost
);

// Delete forum post
router.delete(
  '/:id',
  authenticate,
  checkForumPostAccess,
  forumController.deleteForumPost
);

// Get comments for a forum post
router.get(
  '/:id/comments',
  authenticate,
  validateRequest(searchForumCommentsSchema),
  forumController.getForumComments
);

// Create comment on a forum post
router.post(
  '/:id/comments',
  authenticate,
  validateRequest(createForumCommentSchema),
  forumController.createForumComment
);

// Update comment
router.put(
  '/:id/comments/:commentId',
  authenticate,
  checkForumCommentAccess,
  validateRequest(updateForumCommentSchema),
  forumController.updateForumComment
);

// Delete comment
router.delete(
  '/:id/comments/:commentId',
  authenticate,
  checkForumCommentAccess,
  forumController.deleteForumComment
);

// Like/unlike a forum post
router.post(
  '/:id/like',
  authenticate,
  checkLikeAccess,
  forumController.togglePostLike
);

// Like/unlike a comment
router.post(
  '/:id/comments/:commentId/like',
  authenticate,
  checkLikeAccess,
  forumController.toggleCommentLike
);

export default router; 