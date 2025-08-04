import { Request, Response, NextFunction } from 'express';
import * as forumService from '../services/forum.service';
import { ApiError } from '../middleware/error.middleware';
import { ForumCategory } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all forum posts
export const getAllForumPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      category, 
      authorId,
      isPinned
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    const result = await forumService.getAllPosts({
      page: pageNum,
      limit: limitNum,
      search: search && search !== '' ? search as string : undefined,
      category: category && category !== '' ? category as ForumCategory : undefined,
      authorId: authorId ? parseInt(authorId as string) : undefined,
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
  } catch (error) {
    next(error);
  }
};

// Get forum post by ID
export const getForumPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }
    
    const post = await forumService.getPostById(postId);
    
    res.status(200).json({
      status: 'success',
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create forum post
export const createForumPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const { title, content, category, isPinned, isLocked } = req.body;
    
    if (!title || !content || !category) {
      throw new ApiError('Title, content, and category are required', 400);
    }
    
    const newPost = await forumService.createPost({
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
  } catch (error: any) {
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
};

// Update forum post
export const updateForumPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }
    
    const postData = req.body;
    
    const updatedPost = await forumService.updatePost(postId, postData, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Forum post updated successfully',
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete forum post
export const deleteForumPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }
    
    await forumService.deletePost(postId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Forum post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get comments for a forum post
export const getForumComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }
    
    const { page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new ApiError('Invalid pagination parameters', 400);
    }
    
    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      throw new ApiError('Forum post not found', 404);
    }
    
    // Get comments with pagination
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await prisma.forumComment.count({
      where: { postId },
    });
    
    // Get comments
    const comments = await prisma.forumComment.findMany({
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
            resident: {
              select: {
                rtNumber: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Add isEdited flag and userHasLiked for each comment
    const commentsWithFlags = await Promise.all(
      comments.map(async (comment) => {
        // Check if comment has been edited (updatedAt different from createdAt)
        const isEdited = comment.updatedAt.getTime() !== comment.createdAt.getTime();
        
        // Check if current user has liked this comment
        let userHasLiked = false;
        if (req.user) {
          const userLike = await prisma.forumCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId: req.user.id,
              },
            },
          });
          userHasLiked = !!userLike;
        }

        return {
          ...comment,
          isEdited,
          userHasLiked,
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: commentsWithFlags.length,
      data: {
        comments: commentsWithFlags,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create comment on a forum post
export const createForumComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      throw new ApiError('Invalid forum post ID', 400);
    }
    
    const { content } = req.body;
    
    if (!content) {
      throw new ApiError('Comment content is required', 400);
    }
    
    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      throw new ApiError('Forum post not found', 404);
    }
    
    // Check if post is locked
    if (post.isLocked) {
      throw new ApiError('This post is locked and cannot receive new comments', 403);
    }
    
    // Create comment
    const newComment = await prisma.forumComment.create({
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
  } catch (error) {
    next(error);
  }
};

// Update comment
export const updateForumComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Update comment request:', {
      params: req.params,
      body: req.body,
      user: req.user?.id
    });
    
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    
    if (isNaN(postId) || isNaN(commentId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    const { content } = req.body;
    
    if (!content) {
      throw new ApiError('Comment content is required', 400);
    }
    
    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    
    // Check if comment belongs to the post
    if (comment.postId !== postId) {
      throw new ApiError('Comment does not belong to this post', 400);
    }
    
    // Check if user is the author
    if (comment.authorId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to update this comment', 403);
    }
    
    // Update comment and mark as edited
    const updatedComment = await prisma.forumComment.update({
      where: { id: commentId },
      data: { 
        content,
        updatedAt: new Date() // Explicitly update the timestamp
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
    
    res.status(200).json({
      status: 'success',
      message: 'Comment updated successfully',
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
export const deleteForumComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    
    if (isNaN(postId) || isNaN(commentId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    
    // Check if comment belongs to the post
    if (comment.postId !== postId) {
      throw new ApiError('Comment does not belong to this post', 400);
    }
    
    // Check if user is the author or has permission
    if (comment.authorId !== req.user.id && !['ADMIN', 'RW'].includes(req.user.role)) {
      throw new ApiError('You are not authorized to delete this comment', 403);
    }
    
    // Delete comment
    await prisma.forumComment.delete({
      where: { id: commentId },
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Like/unlike a forum post
export const togglePostLike = async (req: Request, res: Response, next: NextFunction) => {
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
    });
    
    if (!post) {
      throw new ApiError('Forum post not found', 404);
    }
    
    // Check if user has already liked the post
    const existingLike = await prisma.forumLike.findUnique({
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
      await prisma.forumLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      // Like the post
      await prisma.forumLike.create({
        data: {
          postId,
          userId: req.user.id,
        },
      });
      liked = true;
    }
    
    // Get updated like count
    const likeCount = await prisma.forumLike.count({
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
  } catch (error) {
    next(error);
  }
};

// Like/unlike a comment
export const toggleCommentLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    
    if (isNaN(postId) || isNaN(commentId)) {
      throw new ApiError('Invalid ID parameters', 400);
    }
    
    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    
    // Check if comment belongs to the post
    if (comment.postId !== postId) {
      throw new ApiError('Comment does not belong to this post', 400);
    }
    
    // Check if user has already liked the comment
    const existingLike = await prisma.forumCommentLike.findUnique({
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
      await prisma.forumCommentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      // Like the comment
      await prisma.forumCommentLike.create({
        data: {
          commentId,
          userId: req.user.id,
        },
      });
      liked = true;
    }
    
    // Get updated like count
    const likeCount = await prisma.forumCommentLike.count({
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
  } catch (error) {
    next(error);
  }
};

// Get forum statistics
export const getForumStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get statistics directly from the database
    const totalPosts = await prisma.forumPost.count();
    const totalComments = await prisma.forumComment.count();
    const totalLikes = await prisma.forumLike.count();
    
    const announcements = await prisma.forumPost.count({
      where: { category: 'PENGUMUMAN' },
    });
    
    const discussions = await prisma.forumPost.count({
      where: { category: 'DISKUSI' },
    });
    
    const pinnedPosts = await prisma.forumPost.count({
      where: { isPinned: true },
    });
    
    const lockedPosts = await prisma.forumPost.count({
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
  } catch (error) {
    next(error);
  }
}; 