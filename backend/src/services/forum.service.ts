import { PrismaClient, ForumCategory } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

// Interface for forum post creation/update
interface ForumPostInput {
  title: string;
  content: string;
  category: ForumCategory;
  isPinned?: boolean;
  isLocked?: boolean;
}

// Get all forum posts with filtering
export const getAllPosts = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: ForumCategory;
    authorId?: number;
    isPinned?: boolean;
  } = {}
) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    category, 
    authorId,
    isPinned
  } = params;
  
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const where: any = {};
  
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
  const total = await prisma.forumPost.count({ where });
  
  // Get posts
  const posts = await prisma.forumPost.findMany({
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
};

// Get post by ID
export const getPostById = async (id: number) => {
  const post = await prisma.forumPost.findUnique({
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
    throw new ApiError('Post not found', 404);
  }
  
  return post;
};

// Create new post
export const createPost = async (data: ForumPostInput, authorId: number) => {
  // Create post
  const post = await prisma.forumPost.create({
    data: {
      ...data,
      authorId,
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
  
  // If this is an announcement, create notifications for users
  if (data.category === 'PENGUMUMAN') {
    // Get all users except the author
    const users = await prisma.user.findMany({
      where: {
        id: { not: authorId },
      },
            select: {
        id: true,
      },
    });
    
    const userIds = users.map(user => user.id);
    
    // Create notification for all users
    await notificationService.createNotificationForUsers(
      userIds,
      {
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
      }
    );
  }
  
  return post;
};

// Update post
export const updatePost = async (id: number, data: Partial<ForumPostInput>, userId: number) => {
  // Check if post exists
  const existingPost = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });
  
  if (!existingPost) {
    throw new ApiError('Post not found', 404);
  }
  
  // Check if user is the author or has permission
  if (existingPost.authorId !== userId) {
    throw new ApiError('You do not have permission to update this post', 403);
  }
  
  // Update post
  const updatedPost = await prisma.forumPost.update({
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
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
      },
            select: {
        id: true,
      },
    });
    
    const userIds = users.map(user => user.id);
    
    // Create notification for all users about the update
    await notificationService.createNotificationForUsers(
      userIds,
      {
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
      }
    );
  }
  
  return updatedPost;
};

// Delete post
export const deletePost = async (id: number, userId: number) => {
  // Check if post exists
  const post = await prisma.forumPost.findUnique({
    where: { id },
  });
  
  if (!post) {
    throw new ApiError('Post not found', 404);
  }
  
  // Check if user is the author or has permission
  if (post.authorId !== userId) {
    throw new ApiError('You do not have permission to delete this post', 403);
  }
  
  // Delete post
  await prisma.forumPost.delete({
    where: { id },
  });
  
  return true;
};

// Toggle pin post
export const togglePinPost = async (id: number, isPinned: boolean, userId: number) => {
  // Check if post exists
  const post = await prisma.forumPost.findUnique({
    where: { id },
  });
  
  if (!post) {
    throw new ApiError('Post not found', 404);
  }
  
  // Update post
  const updatedPost = await prisma.forumPost.update({
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
    const users = await prisma.user.findMany({
      where: {
        id: { not: post.authorId },
      },
        select: {
          id: true,
      },
    });
    
    const userIds = users.map(user => user.id);
    
    // Create notification for all users
    await notificationService.createNotificationForUsers(
      userIds,
      {
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
      }
    );
  }
  
  return updatedPost;
};

// Toggle lock post
export const toggleLockPost = async (id: number, isLocked: boolean, userId: number) => {
  // Check if post exists
  const post = await prisma.forumPost.findUnique({
    where: { id },
  });
  
  if (!post) {
    throw new ApiError('Post not found', 404);
  }
  
  // Update post
  const updatedPost = await prisma.forumPost.update({
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
}; 