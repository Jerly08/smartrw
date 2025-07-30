import { useState, useEffect } from 'react';
import { documentApi, eventApi, complaintApi, forumApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Document } from '@/lib/types/document';
import { Event, RSVPStatus } from '@/lib/types/event';
import { ForumPost, ForumCategory } from '@/lib/types/forum';

// Dashboard data types
export interface DashboardDocument {
  id: number;
  type: string;
  subject: string;
  createdAt: string;
  status: string;
}

export interface DashboardEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  rsvpStatus?: RSVPStatus | null;
}

export interface DashboardAnnouncement {
  id: number;
  title: string;
  date: string;
  content: string;
  author: string;
}

export interface DashboardData {
  documents: {
    pending: number;
    items: DashboardDocument[];
    loading: boolean;
    error: string | null;
  };
  events: {
    items: DashboardEvent[];
    loading: boolean;
    error: string | null;
  };
  announcements: {
    items: DashboardAnnouncement[];
    loading: boolean;
    error: string | null;
  };
}

// Polling interval in milliseconds
const POLLING_INTERVAL = 30000; // 30 seconds

export function useDashboardData() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    documents: {
      pending: 0,
      items: [],
      loading: true,
      error: null,
    },
    events: {
      items: [],
      loading: true,
      error: null,
    },
    announcements: {
      items: [],
      loading: true,
      error: null,
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await documentApi.getAllDocuments({ 
        limit: 4, 
        requesterId: user?.id 
      });
      
      const formattedDocs = response.documents.map((doc: Document) => ({
        id: doc.id,
        type: doc.type,
        subject: doc.subject,
        createdAt: formatDate(doc.createdAt),
        status: doc.status,
      }));
      
      // Count pending documents
      const pendingCount = response.documents.filter((doc: Document) => 
        doc.status === 'DIAJUKAN' || doc.status === 'DIPROSES'
      ).length;
      
      setDashboardData(prev => ({
        ...prev,
        documents: {
          pending: pendingCount,
          items: formattedDocs,
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDashboardData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          loading: false,
          error: 'Gagal memuat data dokumen',
        },
      }));
    }
  };

  // Fetch upcoming events
  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAllEvents({ 
        isUpcoming: true,
        limit: 5
      });
      
      const formattedEvents = response.events.map((event: Event) => {
        // Find user's RSVP status if they have responded
        const userRsvp = event.participants?.find((p: any) => p.user.id === user?.id);
        
        return {
          id: event.id,
          title: event.title,
          date: formatDate(event.startDate),
          time: formatTime(event.startDate),
          location: event.location,
          description: event.description,
          rsvpStatus: userRsvp?.status || null,
        };
      });
      
      setDashboardData(prev => ({
        ...prev,
        events: {
          items: formattedEvents,
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      setDashboardData(prev => ({
        ...prev,
        events: {
          ...prev.events,
          loading: false,
          error: 'Gagal memuat data kegiatan',
        },
      }));
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      // Get announcements from forum posts with PENGUMUMAN category
      const response = await forumApi.getAllPosts({ 
        category: ForumCategory.PENGUMUMAN,
        limit: 5,
        isPinned: true
      });
      
      const formattedAnnouncements = response.posts.map((post: ForumPost) => ({
        id: post.id,
        title: post.title,
        date: formatDate(post.createdAt),
        content: post.content,
        author: post.author?.name || 'Admin',
      }));
      
      setDashboardData(prev => ({
        ...prev,
        announcements: {
          items: formattedAnnouncements,
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setDashboardData(prev => ({
        ...prev,
        announcements: {
          ...prev.announcements,
          loading: false,
          error: 'Gagal memuat pengumuman',
        },
      }));
    }
  };

  // Handle RSVP to event
  const handleRsvp = async (eventId: number, status: RSVPStatus) => {
    try {
      await eventApi.rsvpToEvent(eventId, { status });
      
      // Update the local state
      setDashboardData(prev => ({
        ...prev,
        events: {
          ...prev.events,
          items: prev.events.items.map(event => 
            event.id === eventId 
              ? { ...event, rsvpStatus: status } 
              : event
          ),
        },
      }));
    } catch (error) {
      console.error('Error updating RSVP:', error);
      // Show error or retry
    }
  };

  // Fetch all data
  const fetchAllData = () => {
    fetchDocuments();
    fetchEvents();
    fetchAnnouncements();
  };

  // Set up polling for real-time updates
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchAllData();
    
    // Set up polling interval
    const intervalId = setInterval(fetchAllData, POLLING_INTERVAL);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  return {
    dashboardData,
    handleRsvp,
    refreshData: fetchAllData
  };
} 