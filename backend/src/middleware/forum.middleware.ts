import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { ApiError } from './error.middleware';

const prisma = new PrismaClient();

// Check if user can access a forum post
export const checkForumPostAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
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
      throw new ApiError('Forum post not found', 404);
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
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id }
      });

      if (!rtResident) {
        throw new ApiError('RT profile not found', 404);
      }

      // Check if post author is from RT's area
      if (post.author.resident && 
          post.author.resident.rtNumber === rtResident.rtNumber && 
          post.author.resident.rwNumber === rtResident.rwNumber) {
        return next();
      }
    }

    throw new ApiError('You do not have permission to modify this post', 403);
  } catch (error) {
    next(error);
  }
};

// Check if user can create an announcement
export const checkAnnouncementAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Only Admin and RW can create announcements
    if (req.user.role === 'ADMIN' || req.user.role === 'RW') {
      return next();
    }

    throw new ApiError('Only Admin and RW can create announcements', 403);
  } catch (error) {
    next(error);
  }
};

// Check if user can access a forum comment
export const checkForumCommentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const commentId = parseInt(req.params.commentId);
    
    if (isNaN(commentId)) {
      throw new ApiError('Invalid comment ID', 400);
    }

    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
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
      throw new ApiError('Comment not found', 404);
    }

    // For GET requests, all authenticated users can access
    if (req.method === 'GET') {
      return next();
    }

    // Check if the post is locked
    if (comment.post.isLocked && req.method !== 'GET') {
      throw new ApiError('This post is locked and cannot be modified', 403);
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
      const rtResident = await prisma.resident.findFirst({
        where: { userId: req.user.id }
      });

      if (!rtResident) {
        throw new ApiError('RT profile not found', 404);
      }

      // Check if comment author is from RT's area
      if (comment.author.resident && 
          comment.author.resident.rtNumber === rtResident.rtNumber && 
          comment.author.resident.rwNumber === rtResident.rwNumber) {
        return next();
      }
    }

    throw new ApiError('You do not have permission to modify this comment', 403);
  } catch (error) {
    next(error);
  }
};

// Check if user can like/unlike a post or comment
export const checkLikeAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // All authenticated users can like/unlike
    return next();
  } catch (error) {
    next(error);
  }
}; 