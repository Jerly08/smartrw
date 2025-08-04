import { z } from 'zod';
import { User } from '../types';

// Forum category enum (matching Prisma schema)
export enum ForumCategory {
  PENGUMUMAN = 'PENGUMUMAN',
  DISKUSI = 'DISKUSI',
  POLLING = 'POLLING',
  LAINNYA = 'LAINNYA',
}

// Forum post interface
export interface ForumPost {
  id: number;
  title: string;
  content: string;
  category: ForumCategory;
  isPinned: boolean;
  isLocked: boolean;
  authorId: number;
  author?: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    likes: number;
  };
  comments?: ForumComment[];
  likes?: ForumLike[];
  userHasLiked?: boolean;
}

// Forum comment interface
export interface ForumComment {
  id: number;
  postId: number;
  authorId: number;
  author?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    likes: number;
  };
  userHasLiked?: boolean;
  isEdited?: boolean;
}

// Forum like interface
export interface ForumLike {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}

// Comment like interface
export interface ForumCommentLike {
  id: number;
  commentId: number;
  userId: number;
  createdAt: string;
}

// Forum post form schema
export const forumPostFormSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  category: z.nativeEnum(ForumCategory, {
    errorMap: () => ({ message: 'Kategori harus dipilih' }),
  }),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export type ForumPostFormData = z.infer<typeof forumPostFormSchema>;

// Forum comment form schema
export const forumCommentFormSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong'),
});

export type ForumCommentFormData = z.infer<typeof forumCommentFormSchema>;

// Forum filter interface
export interface ForumFilter {
  search?: string;
  category?: ForumCategory;
  isPinned?: boolean;
  isLocked?: boolean;
  authorId?: number;
  rtNumber?: string;
  startDate?: string;
  endDate?: string;
}

// Translated options for UI display
export const forumCategoryOptions = [
  { value: ForumCategory.PENGUMUMAN, label: 'Pengumuman', color: 'bg-red-100 text-red-800' },
  { value: ForumCategory.DISKUSI, label: 'Diskusi', color: 'bg-blue-100 text-blue-800' },
  { value: ForumCategory.POLLING, label: 'Polling', color: 'bg-purple-100 text-purple-800' },
  { value: ForumCategory.LAINNYA, label: 'Lainnya', color: 'bg-gray-100 text-gray-800' },
]; 