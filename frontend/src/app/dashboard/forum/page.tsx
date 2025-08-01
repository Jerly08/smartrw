'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { forumApi } from '@/lib/api';
import {
  ForumPost,
  ForumCategory,
  forumCategoryOptions,
  ForumFilter,
} from '@/lib/types/forum';
import {
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash,
  FiEye,
  FiThumbsUp,
  FiMessageCircle,
  FiClock,
  FiLock,
  FiUnlock,
  FiDownload,
  FiAlertCircle,
  FiAnchor
} from 'react-icons/fi';
import Link from 'next/link';

export default function ForumPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ForumFilter>({
    search: '',
    category: undefined,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';

  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
  }, [loading, pagination.currentPage]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: 10,
      };

      // For RT users, add RT number filter
      if (isRT && user?.resident?.rtNumber) {
        params.rtNumber = user.resident.rtNumber;
      }

      const response = await forumApi.getAllPosts(params);
      setPosts(response.posts);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
      });
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      setError('Gagal memuat data forum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (e.target.name === 'category') {
      setFilters({
        ...filters,
        [e.target.name]: e.target.value ? e.target.value as ForumCategory : undefined,
      });
    } else {
      setFilters({
        ...filters,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
    fetchPosts();
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
      return;
    }
    
    try {
      await forumApi.deletePost(id);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Gagal menghapus postingan');
    }
  };

  const handleTogglePinPost = async (id: number, isPinned: boolean) => {
    try {
      await forumApi.togglePinPost(id, !isPinned);
      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin status:', error);
      setError(`Gagal ${isPinned ? 'melepas pin' : 'pin'} postingan`);
    }
  };

  const handleToggleLockPost = async (id: number, isLocked: boolean) => {
    try {
      await forumApi.toggleLockPost(id, !isLocked);
      fetchPosts();
    } catch (error) {
      console.error('Error toggling lock status:', error);
      setError(`Gagal ${isLocked ? 'membuka kunci' : 'mengunci'} postingan`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  const canCreateAnnouncement = () => {
    return isAdmin || isRW;
  };

  const canModeratePost = (post: ForumPost) => {
    if (isAdmin || isRW) return true;
    if (isRT && post.author?.resident?.rtNumber === user?.resident?.rtNumber) return true;
    return post.authorId === user?.id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Forum Komunikasi Digital</h1>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Link href="/dashboard/forum/buat" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2" /> Buat Diskusi
          </Link>
          
          {canCreateAnnouncement() && (
            <Link href="/dashboard/forum/pengumuman/buat" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              <FiPlus className="mr-2" /> Buat Pengumuman
            </Link>
          )}
        </div>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search || ''}
                onChange={handleFilterChange}
                placeholder="Cari berdasarkan judul atau konten..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={filters.category || ''}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Semua Kategori</option>
                {forumCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="self-end">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Belum ada postingan yang dibuat
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className={`bg-white rounded-lg shadow overflow-hidden ${post.isPinned ? 'border-l-4 border-yellow-400' : ''}`}>
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
                    <span>Oleh: {post.author?.name || 'Unknown'}</span>
                    {post.author?.resident?.rtNumber && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        RT {post.author.resident.rtNumber}
                      </span>
                    )}
                    {!post.author ? null : post.author.role === 'RT' ? (
                      <span className="ml-2 text-xs bg-blue-100 px-2 py-0.5 rounded-full text-blue-800">
                        RT
                      </span>
                    ) : post.author.role === 'RW' ? (
                      <span className="ml-2 text-xs bg-green-100 px-2 py-0.5 rounded-full text-green-800">
                        RW
                      </span>
                    ) : null}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-600 line-clamp-2">{post.content}</p>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <FiThumbsUp className="mr-1" />
                    <span>{post._count?.likes || 0} suka</span>
                  </div>
                  <div className="flex items-center">
                    <FiMessageCircle className="mr-1" />
                    <span>{post._count?.comments || 0} komentar</span>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/dashboard/forum/${post.id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <FiEye className="mr-1" /> Lihat
                  </Link>
                  
                  {/* Only show edit button if user is the author or has moderation rights */}
                  {canModeratePost(post) && !post.isLocked && (
                    <>
                      <Link href={`/dashboard/forum/${post.id}/edit`} className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                        <FiEdit className="mr-1" /> Edit
                      </Link>
                      
                      <button
                        onClick={() => handleDeletePost(post.id)}
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
                        onClick={() => handleTogglePinPost(post.id, post.isPinned)}
                        className="inline-flex items-center px-3 py-1.5 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                      >
                        <FiAnchor className="mr-1" /> {post.isPinned ? 'Lepas Pin' : 'Pin'}
                      </button>
                      
                      <button
                        onClick={() => handleToggleLockPost(post.id, post.isLocked)}
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                  page === pagination.currentPage
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 