'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { forumApi } from '@/lib/api';
import {
  ForumPost,
  ForumComment,
  ForumCategory,
  forumCategoryOptions,
  forumCommentFormSchema,
  ForumCommentFormData,
} from '@/lib/types/forum';
import {
  FiMessageSquare,
  FiEdit,
  FiTrash,
  FiThumbsUp,
  FiMessageCircle,
  FiClock,
  FiLock,
  FiUnlock,
  FiPinned,
  FiArrowLeft,
  FiSend,
  FiAlertCircle,
  FiUser,
} from 'react-icons/fi';
import Link from 'next/link';

export default function ForumPostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentPagination, setCommentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const postId = parseInt(params.id);
  
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForumCommentFormData>({
    resolver: zodResolver(forumCommentFormSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (!loading) {
      fetchPost();
      fetchComments();
    }
  }, [postId, loading, commentPagination.currentPage]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const data = await forumApi.getPostById(postId);
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Gagal memuat data postingan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const params = {
        page: commentPagination.currentPage,
        limit: 10,
      };
      
      const response = await forumApi.getPostComments(postId, params);
      setComments(response.comments);
      setCommentPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Gagal memuat komentar');
    }
  };

  const handleCommentPageChange = (page: number) => {
    setCommentPagination({ ...commentPagination, currentPage: page });
  };

  const handleDeletePost = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
      return;
    }
    
    try {
      await forumApi.deletePost(postId);
      router.push('/dashboard/forum');
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Gagal menghapus postingan');
    }
  };

  const handleTogglePinPost = async () => {
    if (!post) return;
    
    try {
      await forumApi.togglePinPost(postId, !post.isPinned);
      fetchPost();
    } catch (error) {
      console.error('Error toggling pin status:', error);
      setError(`Gagal ${post.isPinned ? 'melepas pin' : 'pin'} postingan`);
    }
  };

  const handleToggleLockPost = async () => {
    if (!post) return;
    
    try {
      await forumApi.toggleLockPost(postId, !post.isLocked);
      fetchPost();
    } catch (error) {
      console.error('Error toggling lock status:', error);
      setError(`Gagal ${post.isLocked ? 'membuka kunci' : 'mengunci'} postingan`);
    }
  };

  const handleToggleLikePost = async () => {
    try {
      await forumApi.toggleLikePost(postId);
      fetchPost();
    } catch (error) {
      console.error('Error toggling like status:', error);
      setError('Gagal menyukai postingan');
    }
  };

  const handleToggleLikeComment = async (commentId: number) => {
    try {
      await forumApi.toggleLikeComment(postId, commentId);
      fetchComments();
    } catch (error) {
      console.error('Error toggling comment like status:', error);
      setError('Gagal menyukai komentar');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
      return;
    }
    
    try {
      await forumApi.deleteComment(postId, commentId);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Gagal menghapus komentar');
    }
  };

  const onSubmitComment = async (data: ForumCommentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await forumApi.addComment(postId, data);
      reset(); // Clear the form
      fetchComments();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Gagal menambahkan komentar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: ForumCategory) => {
    const categoryOption = forumCategoryOptions.find(option => option.value === category);
    return categoryOption?.label || category;
  };

  const getCategoryColor = (category: ForumCategory) => {
    const categoryOption = forumCategoryOptions.find(option => option.value === category);
    return categoryOption?.color || 'bg-gray-100 text-gray-800';
  };

  const canModeratePost = () => {
    if (!post || !user) return false;
    if (isAdmin || isRW) return true;
    if (isRT && post.author?.resident?.rtNumber === user.resident?.rtNumber) return true;
    return post.authorId === user.id;
  };

  const canModerateComment = (comment: ForumComment) => {
    if (!user) return false;
    if (isAdmin || isRW) return true;
    if (isRT && comment.author?.resident?.rtNumber === user.resident?.rtNumber) return true;
    return comment.authorId === user.id;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Detail Postingan</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail */}
      <div className={`bg-white rounded-lg shadow overflow-hidden ${post.isPinned ? 'border-l-4 border-yellow-400' : ''}`}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                {post.isPinned && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Dipin
                  </span>
                )}
                {post.isLocked && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Dikunci
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{post.title}</h2>
            </div>
            <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500">
              <FiClock className="mr-1" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex items-center text-sm text-gray-600">
              <FiUser className="mr-1" />
              <span>Oleh: {post.author?.name || 'Unknown'}</span>
              {post.author?.resident?.rtNumber && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  RT {post.author.resident.rtNumber}
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={handleToggleLikePost}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md ${
                post.userHasLiked
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiThumbsUp />
              <span>{post._count?.likes || 0} Suka</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500">
              <FiMessageCircle />
              <span>{post._count?.comments || 0} Komentar</span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
            {/* Only show edit button if user is the author or has moderation rights */}
            {canModeratePost() && !post.isLocked && (
              <>
                <Link href={`/dashboard/forum/${post.id}/edit`} className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                  <FiEdit className="mr-1" /> Edit
                </Link>
                
                <button
                  onClick={handleDeletePost}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <FiTrash className="mr-1" /> Hapus
                </button>
              </>
            )}
            
            {/* Admin and RW can pin/unpin and lock/unlock posts */}
            {(isAdmin || isRW) && (
              <>
                <button
                  onClick={handleTogglePinPost}
                  className="inline-flex items-center px-3 py-1.5 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  <FiPinned className="mr-1" /> {post.isPinned ? 'Lepas Pin' : 'Pin'}
                </button>
                
                <button
                  onClick={handleToggleLockPost}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {post.isLocked ? (
                    <>
                      <FiUnlock className="mr-1" /> Buka Kunci
                    </>
                  ) : (
                    <>
                      <FiLock className="mr-1" /> Kunci
                    </>
                  )}
                </button>
              </>
            )}
            
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-1" /> Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      {!post.isLocked && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tambahkan Komentar</h3>
          <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-4">
            <div>
              <textarea
                id="content"
                rows={3}
                className={`block w-full px-3 py-2 border ${
                  errors.content ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Tulis komentar Anda di sini..."
                {...register('content')}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : (
                  <>
                    <FiSend className="mr-1" /> Kirim Komentar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Komentar ({commentPagination.totalItems})</h3>
        
        {comments.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            Belum ada komentar
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="font-medium text-gray-900">{comment.author?.name || 'Unknown'}</div>
                  {comment.author?.resident?.rtNumber && (
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      RT {comment.author.resident.rtNumber}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{formatDate(comment.createdAt)}</div>
              </div>
              
              <div className="mt-2 text-gray-700">
                <p className="whitespace-pre-wrap">{comment.content}</p>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggleLikeComment(comment.id)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                      comment.userHasLiked
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FiThumbsUp className="mr-1" />
                    <span>{comment._count?.likes || 0}</span>
                  </button>
                </div>
                
                {canModerateComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Comment Pagination */}
        {commentPagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => handleCommentPageChange(commentPagination.currentPage - 1)}
                disabled={commentPagination.currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: commentPagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handleCommentPageChange(page)}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                    page === commentPagination.currentPage
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handleCommentPageChange(commentPagination.currentPage + 1)}
                disabled={commentPagination.currentPage === commentPagination.totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 