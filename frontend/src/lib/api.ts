// Resident Document type definition (for verification docs)
export type ResidentDocumentInfo = {
  id: number;
  type: string;
  filename: string;
  uploadedAt: string | null;
  status: string;
  fileUrl: string | null;
};

import axios from 'axios';
import { AuthResponse, LoginFormData, RegisterFormData } from './types';
import { Resident, ResidentFormData, ResidentFilter } from './types/resident';
import { Document, DocumentFormData, DocumentFilter, DocumentStatus } from './types/document';
import { Event, EventFormData, EventFilter, RSVPFormData, PhotoUploadData } from './types/event';
import { Complaint, ComplaintFormData, ComplaintFilter, ResponseFormData } from './types/complaint';
import { 
  SocialAssistance, 
  SocialAssistanceFormData, 
  SocialAssistanceFilter,
  SocialAssistanceRecipient,
  RecipientFormData,
  RecipientFilter,
  VerificationFormData,
  DistributionFormData
} from './types/socialAssistance';
import {
  ForumPost,
  ForumComment,
  ForumPostFormData,
  ForumCommentFormData,
  ForumFilter
} from './types/forum';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationFilter,
  NotificationResponse
} from './types/notification';
import { RTDashboardStats, PendingVerification, PendingDocument, UpcomingEvent } from './types/dashboard';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is a connection error
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.warn('API connection error. Using mock data if available.');
      // Return a resolved promise with mock data
      return Promise.resolve({ data: { status: 'success', data: {} } });
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    console.log('Login request:', data);
    const response = await api.post<{status: string, message: string, data: AuthResponse}>('/auth/login', data);
    console.log('Login response:', response.data);
    return response.data.data;
  },
  
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    console.log('Register request:', data);
    const { confirmPassword, ...registerData } = data;
    const response = await api.post<{status: string, message: string, data: AuthResponse}>('/auth/register', registerData);
    console.log('Register response:', response.data);
    return response.data.data;
  },
  
  getProfile: async (): Promise<AuthResponse['user']> => {
    console.log('Getting profile');
    const response = await api.get<{status: string, data: {user: AuthResponse['user']}}>('/auth/profile');
    console.log('Profile response:', response.data);
    return response.data.data.user;
  },

  updateProfile: async (data: {name?: string, email?: string, phoneNumber?: string}): Promise<AuthResponse['user']> => {
    console.log('Updating profile:', data);
    const response = await api.put<{status: string, message: string, data: {user: AuthResponse['user']}}>('/auth/profile', data);
    console.log('Profile update response:', response.data);
    return response.data.data.user;
  },

  changePassword: async (data: {currentPassword: string, newPassword: string}): Promise<{success: boolean, message: string}> => {
    console.log('Changing password');
    const response = await api.put<{status: string, message: string}>('/auth/password', data);
    console.log('Password change response:', response.data);
    return {
      success: response.data.status === 'success',
      message: response.data.message
    };
  },

  verify: async (data: {
    name: string;
    birthDate: string;
    address: string;
    rtId: number;
    nik?: string;
    noKK?: string;
    gender?: string;
    familyRole?: string;
  }): Promise<{success: boolean, message: string, isUpdate?: boolean}> => {
    console.log('Verifying resident data');
    const response = await api.post<{status: string, message: string, data?: any}>('/auth/verify-resident', data);
    console.log('Verification response:', response.data);
    return {
      success: response.data.status === 'success',
      message: response.data.message,
      isUpdate: response.data.data?.isUpdate
    };
  },

  uploadVerificationDocuments: async (data: FormData): Promise<{ success: boolean, message: string }> => {
    const response = await api.post('/auth/upload-verification', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// RT API functions
export const rtApi = {
  // Get all RTs
  getAllRTs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  } = {}) => {
    const response = await api.get('/rt', { params });
    return response.data.data;
  },

  // Get RT by ID
  getRTById: async (id: number) => {
    const response = await api.get(`/rt/${id}`);
    return response.data.data.rt;
  },

  // Get RT by number
  getRTByNumber: async (number: string) => {
    const response = await api.get(`/rt/number/${number}`);
    return response.data.data.rt;
  },

  // Create new RT
  createRT: async (data: {
    number: string;
    name?: string;
    description?: string;
    address?: string;
    chairperson?: string;
    phoneNumber?: string;
    email?: string;
    isActive?: boolean;
  }) => {
    const response = await api.post('/rt', data);
    return response.data.data; // Return the complete data object including rt and credentials
  },

  // Update RT
  updateRT: async (id: number, data: {
    number?: string;
    name?: string;
    description?: string;
    address?: string;
    chairperson?: string;
    phoneNumber?: string;
    email?: string;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/rt/${id}`, data);
    return response.data.data.rt;
  },

  // Delete RT
  deleteRT: async (id: number) => {
    const response = await api.delete(`/rt/${id}`);
    return response.data;
  },

  // Get RT statistics
  getRTStatistics: async (id: number) => {
    const response = await api.get(`/rt/${id}/statistics`);
    return response.data.data.statistics;
  },

  // Get residents in RT
  getRTResidents: async (id: number, params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) => {
    const response = await api.get(`/rt/${id}/residents`, { params });
    return response.data.data;
  },
};

// Legacy function for backward compatibility
export const getRTs = async () => {
  const result = await rtApi.getAllRTs({ limit: 50 });
  return result.rts || [];
};

// Resident API functions
export const residentApi = {
  // Get all residents with filtering and pagination
  getAllResidents: async (params: { page?: number; limit?: number } & ResidentFilter) => {
    const response = await api.get('/residents', { params });
    return response.data.data;
  },

  // Get resident by ID
  getResidentById: async (id: number) => {
    const response = await api.get(`/residents/${id}`);
    return response.data.data.resident as Resident;
  },

  // Create new resident
  createResident: async (data: ResidentFormData) => {
    const response = await api.post('/residents', data);
    return response.data.data.resident as Resident;
  },

  // Update resident
  updateResident: async (id: number, data: Partial<ResidentFormData>) => {
    const response = await api.put(`/residents/${id}`, data);
    return response.data.data.resident as Resident;
  },

  // Delete resident
  deleteResident: async (id: number) => {
    const response = await api.delete(`/residents/${id}`);
    return response.data;
  },

  // Verify resident
  verifyResident: async (id: number): Promise<Resident> => {
    const response = await api.patch(`/residents/${id}/verify`);
    return response.data.data.resident as Resident;
  },

  // Get residents pending verification for RT
  getPendingVerification: async (): Promise<Resident[]> => {
    const response = await api.get('/residents/pending-verification');
    return response.data.data as Resident[];
  },

  // Verify resident by RT
  verifyResidentByRT: async (id: number): Promise<Resident> => {
    const response = await api.patch(`/residents/${id}/verify-by-rt`);
    return response.data.data as Resident;
  },

  // Import residents from CSV file
  importResidents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/residents/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Export residents to CSV
  exportResidents: async (filters?: ResidentFilter) => {
    const response = await api.get('/residents/export', { 
      params: filters,
      responseType: 'blob' 
    });
    
    // Create file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'residents.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },

  // Get resident statistics
  getResidentStatistics: async () => {
    const response = await api.get('/residents/statistics');
    return response.data.data.statistics;
  },

  // Get family members
  getFamilyMembers: async (familyId: number) => {
    const response = await api.get(`/families/${familyId}`);
    return response.data.data.family.members as Resident[];
  },

  // Get resident documents
  getResidentDocuments: async (residentId: number): Promise<ResidentDocumentInfo[]> => {
    const response = await api.get(`/residents/${residentId}/documents`);
    return response.data.data.documents as ResidentDocumentInfo[];
  },
};

// Document API functions
export const documentApi = {
  // Get all documents with filtering and pagination
  getAllDocuments: async (params: { page?: number; limit?: number } & DocumentFilter) => {
    const response = await api.get('/documents', { params });
    return response.data.data;
  },

  // Get document by ID
  getDocumentById: async (id: number) => {
    const response = await api.get(`/documents/${id}`);
    return response.data.data.document as Document;
  },

  // Create new document request
  createDocument: async (data: DocumentFormData) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('type', data.type);
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    
    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data.document as Document;
  },

  // Update document status
  updateDocumentStatus: async (id: number, data: { status: DocumentStatus; notes?: string }) => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data.data.document as Document;
  },

  // Process document (approve, reject, sign, complete)
  processDocument: async (id: number, data: { status: DocumentStatus; notes?: string }) => {
    const response = await api.post(`/documents/${id}/process`, data);
    return response.data.data.document as Document;
  },

  // Approve document
  approveDocument: async (id: number, notes?: string) => {
    const response = await api.post(`/documents/${id}/process`, { status: 'approved', notes });
    return response.data.data.document as Document;
  },

  // Reject document
  rejectDocument: async (id: number, notes?: string) => {
    const response = await api.post(`/documents/${id}/process`, { status: 'rejected', notes });
    return response.data.data.document as Document;
  },

  // Sign document
  signDocument: async (id: number, notes?: string) => {
    const response = await api.post(`/documents/${id}/process`, { status: 'signed', notes });
    return response.data.data.document as Document;
  },

  // Complete document
  completeDocument: async (id: number, notes?: string) => {
    const response = await api.post(`/documents/${id}/process`, { status: 'completed', notes });
    return response.data.data.document as Document;
  },

  // Delete document
  deleteDocument: async (id: number) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Download attachment
  downloadAttachment: async (documentId: number, filename: string) => {
    const response = await api.get(`/documents/${documentId}/attachments/${filename}`, {
      responseType: 'blob'
    });
    
    // Create file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },

  // Get document statistics
  getDocumentStatistics: async () => {
    const response = await api.get('/documents/statistics');
    return response.data.data;
  },

  // Download document (completed documents)
  downloadDocument: async (id: number) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    
    // Create file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `surat-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },
};

// Event API functions
export const eventApi = {
  // Get all events with filtering and pagination
  getAllEvents: async (params: { page?: number; limit?: number; isUpcoming?: boolean } & EventFilter) => {
    const response = await api.get('/events', { params });
    return response.data.data;
  },

  // Get event by ID
  getEventById: async (id: number) => {
    const response = await api.get(`/events/${id}`);
    return response.data.data.event as Event;
  },

  // Create new event
  createEvent: async (data: EventFormData) => {
    const response = await api.post('/events', data);
    return response.data.data.event as Event;
  },

  // Update event
  updateEvent: async (id: number, data: Partial<EventFormData>) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data.data.event as Event;
  },

  // Delete event
  deleteEvent: async (id: number) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // RSVP to event
  rsvpToEvent: async (id: number, data: RSVPFormData) => {
    const response = await api.post(`/events/${id}/rsvp`, data);
    return response.data.data.rsvp;
  },

  // Get event participants
  getEventParticipants: async (id: number) => {
    const response = await api.get(`/events/${id}/participants`);
    return response.data.data.participants;
  },

  // Upload event photos
  uploadEventPhotos: async (id: number, data: PhotoUploadData) => {
    const formData = new FormData();
    
    data.photos.forEach(photo => {
      formData.append('photos', photo);
    });
    
    if (data.captions) {
      formData.append('captions', JSON.stringify(data.captions));
    }
    
    const response = await api.post(`/events/${id}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data.photos;
  },

  // Publish event
  publishEvent: async (id: number) => {
    const response = await api.patch(`/events/${id}/publish`);
    return response.data.data.event as Event;
  },

  // Unpublish event
  unpublishEvent: async (id: number) => {
    const response = await api.patch(`/events/${id}/unpublish`);
    return response.data.data.event as Event;
  },

  // Export participants to CSV
  exportParticipants: async (id: number) => {
    const response = await api.get(`/events/${id}/participants/export`, {
      responseType: 'blob'
    });
    
    // Create file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kegiatan-${id}-peserta.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },

  // Get event statistics
  getEventStatistics: async () => {
    const response = await api.get('/events/statistics');
    return response.data.data.statistics;
  },
};

// Complaint API functions
export const complaintApi = {
  // Get all complaints with filtering and pagination
  getAllComplaints: async (params: { page?: number; limit?: number } & ComplaintFilter) => {
    const response = await api.get('/complaints', { params });
    return response.data.data;
  },

  // Get complaint by ID
  getComplaintById: async (id: number) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data.data.complaint as Complaint;
  },

  // Create new complaint
  createComplaint: async (data: ComplaintFormData) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('description', data.description);
    if (data.location) {
      formData.append('location', data.location);
    }
    
    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data.complaint as Complaint;
  },

  // Update complaint
  updateComplaint: async (id: number, data: Partial<ComplaintFormData>) => {
    const formData = new FormData();
    
    // Add text fields
    if (data.title) formData.append('title', data.title);
    if (data.category) formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.location) formData.append('location', data.location);
    
    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.put(`/complaints/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data.complaint as Complaint;
  },

  // Delete complaint
  deleteComplaint: async (id: number) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },

  // Download complaint attachment
  downloadAttachment: async (attachmentUrlOrId: string | number, filename?: string) => {
    try {
      // If we have both complaintId and filename directly
      if (typeof attachmentUrlOrId === 'number' && filename) {
        const response = await api.get(`/complaints/${attachmentUrlOrId}/attachments/${encodeURIComponent(filename)}`, {
          responseType: 'blob',
        });
        
        // Create file download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return true;
      }
      
      // Otherwise, handle as a URL string
      const attachmentUrl = attachmentUrlOrId as string;
      const urlParts = attachmentUrl.split('/');
      const extractedFilename = urlParts.pop() || 'attachment';
      
      // Check if this is a direct URL or a relative path
      if (attachmentUrl.startsWith('/uploads/complaints/')) {
        // Extract complaint ID from the page URL if possible
        const pathSegments = window.location.pathname.split('/');
        const complaintId = parseInt(pathSegments[pathSegments.length - 1]);
        
        if (!isNaN(complaintId)) {
          // Use the API endpoint instead of direct URL
          const response = await api.get(`/complaints/${complaintId}/attachments/${encodeURIComponent(extractedFilename)}`, {
            responseType: 'blob',
          });
          
          // Create file download
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', extractedFilename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          return true;
        }
      }
      
      // Fallback to direct link if we can't determine the complaint ID
      const link = document.createElement('a');
      link.href = attachmentUrl;
      link.setAttribute('download', extractedFilename);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  },

  // Respond to complaint
  respondToComplaint: async (id: number, data: ResponseFormData) => {
    const response = await api.post(`/complaints/${id}/respond`, data);
    return response.data.data.complaint as Complaint;
  },

  // Get complaint statistics
  getComplaintStatistics: async () => {
    const response = await api.get('/complaints/statistics');
    return response.data.data.statistics;
  },
};

// Social Assistance API functions
export const socialAssistanceApi = {
  // Get all social assistance programs with filtering and pagination
  getAllSocialAssistance: async (params: { page?: number; limit?: number } & SocialAssistanceFilter) => {
    const response = await api.get('/social-assistance', { params });
    return response.data.data;
  },

  // Get social assistance by ID
  getSocialAssistanceById: async (id: number) => {
    const response = await api.get(`/social-assistance/${id}`);
    return response.data.data.socialAssistance as SocialAssistance;
  },

  // Create new social assistance program
  createSocialAssistance: async (data: SocialAssistanceFormData) => {
    const response = await api.post('/social-assistance', data);
    return response.data.data.socialAssistance as SocialAssistance;
  },

  // Update social assistance program
  updateSocialAssistance: async (id: number, data: Partial<SocialAssistanceFormData>) => {
    const response = await api.put(`/social-assistance/${id}`, data);
    return response.data.data.socialAssistance as SocialAssistance;
  },

  // Delete social assistance program
  deleteSocialAssistance: async (id: number) => {
    const response = await api.delete(`/social-assistance/${id}`);
    return response.data;
  },

  // Change social assistance status
  updateSocialAssistanceStatus: async (id: number, status: string) => {
    const response = await api.patch(`/social-assistance/${id}/status`, { status });
    return response.data.data.socialAssistance as SocialAssistance;
  },

  // Get all recipients for a social assistance program
  getRecipients: async (
    socialAssistanceId: number, 
    params: { page?: number; limit?: number } & RecipientFilter
  ) => {
    const response = await api.get(`/social-assistance/${socialAssistanceId}/recipients`, { params });
    return response.data.data;
  },

  // Add recipient to social assistance program
  addRecipient: async (socialAssistanceId: number, data: RecipientFormData) => {
    const response = await api.post(`/social-assistance/${socialAssistanceId}/recipients`, data);
    return response.data.data.recipient as SocialAssistanceRecipient;
  },

  // Remove recipient from social assistance program
  removeRecipient: async (socialAssistanceId: number, recipientId: number) => {
    const response = await api.delete(`/social-assistance/${socialAssistanceId}/recipients/${recipientId}`);
    return response.data;
  },

  // Verify recipient
  verifyRecipient: async (socialAssistanceId: number, recipientId: number, data: VerificationFormData) => {
    const response = await api.patch(
      `/social-assistance/${socialAssistanceId}/recipients/${recipientId}/verify`, 
      data
    );
    return response.data.data.recipient as SocialAssistanceRecipient;
  },

  // Mark recipient as received
  markAsReceived: async (socialAssistanceId: number, recipientId: number, data: DistributionFormData) => {
    const response = await api.patch(
      `/social-assistance/${socialAssistanceId}/recipients/${recipientId}/received`, 
      data
    );
    return response.data.data.recipient as SocialAssistanceRecipient;
  },

  // Get social assistance statistics
  getSocialAssistanceStatistics: async () => {
    const response = await api.get('/social-assistance/statistics');
    return response.data.data.statistics;
  },

  // Check resident eligibility for social assistance programs
  checkEligibility: async (residentId: number) => {
    const response = await api.get(`/social-assistance/eligibility/${residentId}`);
    return response.data.data;
  },

  // Export recipients to CSV
  exportRecipients: async (socialAssistanceId: number, params?: RecipientFilter) => {
    const response = await api.get(
      `/social-assistance/${socialAssistanceId}/recipients/export`, 
      { 
        params,
        responseType: 'blob' 
      }
    );
    
    // Create file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bantuan-${socialAssistanceId}-penerima.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },

  // Get resident's social assistance history
  getResidentAssistanceHistory: async (residentId: number) => {
    const response = await api.get(`/residents/${residentId}/social-assistance`);
    return response.data.data.assistanceHistory;
  },
};

// Forum API functions
export const forumApi = {
  // Get all posts with filtering and pagination
  getAllPosts: async (params: { page?: number; limit?: number } & ForumFilter) => {
    const response = await api.get('/forum', { params });
    return response.data.data;
  },

  // Get post by ID
  getPostById: async (id: number) => {
    const response = await api.get(`/forum/${id}`);
    return response.data.data.post;
  },

  // Create new post
  createPost: async (data: ForumPostFormData) => {
    const response = await api.post('/forum', data);
    return response.data.data.post;
  },

  // Update post
  updatePost: async (id: number, data: Partial<ForumPostFormData>) => {
    const response = await api.put(`/forum/${id}`, data);
    return response.data.data.post;
  },

  // Delete post
  deletePost: async (id: number) => {
    const response = await api.delete(`/forum/${id}`);
    return response.data;
  },

  // Get comments for a post
  getPostComments: async (postId: number, params: { page?: number; limit?: number } = {}) => {
    const response = await api.get(`/forum/${postId}/comments`, { params });
    return response.data.data;
  },

  // Add comment to a post
  addComment: async (postId: number, data: ForumCommentFormData) => {
    const response = await api.post(`/forum/${postId}/comments`, data);
    return response.data.data.comment;
  },

  // Like/unlike a post
  togglePostLike: async (postId: number) => {
    const response = await api.post(`/forum/${postId}/like`);
    return response.data.data;
  },

  // Toggle pin/unpin a post
  togglePinPost: async (postId: number, isPinned: boolean) => {
    const response = await api.patch(`/forum/${postId}/pin`, { isPinned });
    return response.data.data;
  },

  // Toggle lock/unlock a post
  toggleLockPost: async (postId: number, isLocked: boolean) => {
    const response = await api.patch(`/forum/${postId}/lock`, { isLocked });
    return response.data.data;
  },

  // Like/unlike a comment
  toggleCommentLike: async (postId: number, commentId: number) => {
    const response = await api.post(`/forum/${postId}/comments/${commentId}/like`);
    return response.data.data;
  },

  // Delete comment
  deleteComment: async (postId: number, commentId: number) => {
    const response = await api.delete(`/forum/${postId}/comments/${commentId}`);
    return response.data;
  },

  // Get forum statistics
  getForumStatistics: async () => {
    const response = await api.get('/forum/statistics');
    return response.data.data.statistics;
  },
};

// Notification API functions
export const notificationApi = {
  // Get all notifications with filtering and pagination
  getAllNotifications: async (params: { page?: number; limit?: number } & NotificationFilter = {}) => {
    // Mock implementation for development
    console.log('Using mock notification API');
    
    // Generate mock notifications
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: NotificationType.DOCUMENT,
        title: 'Dokumen Memerlukan Verifikasi RT',
        message: 'Dokumen Surat Pengantar KTP dari Ahmad Fauzi memerlukan verifikasi Anda',
        isRead: false,
        priority: NotificationPriority.HIGH,
        createdAt: new Date().toISOString(),
        data: JSON.stringify({
          documentId: 101,
          documentType: 'PENGANTAR_SKCC',
          documentSubject: 'Permohonan Pengantar KTP',
          requesterName: 'Ahmad Fauzi',
          requesterNik: '3175020501990003',
        }),
        documentId: 101
      },
      {
        id: 2,
        type: NotificationType.COMPLAINT,
        title: 'Pengaduan Baru',
        message: 'Pengaduan baru tentang kerusakan jalan di RT Anda',
        isRead: false,
        priority: NotificationPriority.NORMAL,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        data: JSON.stringify({
          complaintId: 201,
          complaintTitle: 'Kerusakan Jalan',
          complaintCategory: 'INFRASTRUKTUR',
        }),
        complaintId: 201
      },
      {
        id: 3,
        type: NotificationType.SYSTEM,
        title: 'Verifikasi Warga Baru',
        message: 'Warga baru Siti Rahayu memerlukan verifikasi Anda',
        isRead: false,
        priority: NotificationPriority.HIGH,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        data: JSON.stringify({
          residentId: 301,
          residentName: 'Siti Rahayu',
          residentNik: '3175024309980002',
          residentAddress: 'Jl. Mawar No. 17 RT 003/002',
        })
      },
      {
        id: 4,
        type: NotificationType.SOCIAL_ASSISTANCE,
        title: 'Verifikasi Bantuan Sosial',
        message: 'Calon penerima bantuan BLT memerlukan verifikasi Anda',
        isRead: false,
        priority: NotificationPriority.NORMAL,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        data: JSON.stringify({
          assistanceId: 401,
          assistanceName: 'Bantuan Langsung Tunai',
          assistanceType: 'BLT',
          recipientId: 501,
          residentName: 'Agus Setiawan',
          residentNik: '3175020501960003',
          residentAddress: 'Jl. Mawar No. 20 RT 003/002',
        }),
        socialAssistanceId: 401
      },
      {
        id: 5,
        type: NotificationType.EVENT,
        title: 'Kegiatan Baru',
        message: 'Kegiatan Kerja Bakti akan dilaksanakan pada Minggu, 21 Juli 2024',
        isRead: true,
        priority: NotificationPriority.NORMAL,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        data: JSON.stringify({
          eventId: 501,
          eventTitle: 'Kerja Bakti RT 003',
          eventDate: '2024-07-21T07:00:00',
          eventLocation: 'Jl. Mawar RT 003/002',
        }),
        eventId: 501
      }
    ];
    
    // Apply filters
    let filteredNotifications = [...mockNotifications];
    
    if (params.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === params.type);
    }
    
    if (params.isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === params.isRead);
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    return {
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / limit),
      }
    };
  },

  // Get unread notification count
  getUnreadCount: async () => {
    // Mock implementation
    return 4; // Mock unread count
  },

  // Mark notification as read
  markAsRead: async (id: number) => {
    // Mock implementation
    console.log(`Marking notification ${id} as read`);
    return true;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    // Mock implementation
    console.log('Marking all notifications as read');
    return true;
  },

  // Delete notification
  deleteNotification: async (id: number) => {
    // Mock implementation
    console.log(`Deleting notification ${id}`);
    return true;
  }
};

// Dashboard API functions
export const dashboardApi = {
  // Get RT dashboard statistics
  getRTDashboardStats: async () => {
    try {
      const response = await api.get('/rt/dashboard/stats');
      return response.data.data as RTDashboardStats;
    } catch (error) {
      console.log('Using mock dashboard stats');
      // Mock data for development
      const mockStats: RTDashboardStats = {
        rtNumber: '003',
        rwNumber: '002',
        residents: {
          total: 65,
          verified: 63,
          unverified: 2,
          families: 18
        },
        documents: {
          pending: 3,
          total: 25
        },
        complaints: {
          open: 2,
          total: 8
        },
        events: {
          upcoming: 1
        }
      };
      return mockStats;
    }
  },

  // Get pending verifications for RT
  getRTPendingVerifications: async (params: { page?: number; limit?: number }) => {
    try {
      const response = await api.get('/rt/verifications/pending', { params });
      return response.data.data as { 
        verifications: PendingVerification[],
        pagination: { page: number, limit: number, total: number, totalPages: number }
      };
    } catch (error) {
      console.log('Using mock pending verifications');
      // Mock data for development
      const mockVerifications: PendingVerification[] = [
        {
          id: 1,
          residentId: 101,
          name: 'Ahmad Fauzi',
          nik: '3175020501990003',
          address: 'Jl. Mawar No. 15 RT 003/002',
          rtNumber: '003',
          rwNumber: '002',
          submittedAt: '2024-07-15T10:30:00'
        },
        {
          id: 2,
          residentId: 102,
          name: 'Siti Rahayu',
          nik: '3175024309980002',
          address: 'Jl. Mawar No. 17 RT 003/002',
          rtNumber: '003',
          rwNumber: '002',
          submittedAt: '2024-07-14T14:15:00'
        }
      ];
      
      return {
        verifications: mockVerifications,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: mockVerifications.length,
          totalPages: 1
        }
      };
    }
  },

  // Get pending documents for RT
  getRTPendingDocuments: async (params: { page?: number; limit?: number }) => {
    try {
      const response = await api.get('/rt/documents/pending', { params });
      return response.data.data as {
        documents: PendingDocument[],
        pagination: { page: number, limit: number, total: number, totalPages: number }
      };
    } catch (error) {
      console.log('Using mock pending documents');
      // Mock data for development
      const mockDocuments: PendingDocument[] = [
        {
          id: 1,
          documentId: 201,
          type: 'Surat Pengantar KTP',
          requester: 'Budi Santoso',
          requesterNik: '3175020501980001',
          subject: 'Permohonan Pengantar KTP',
          submittedAt: '2024-07-16T09:30:00'
        },
        {
          id: 2,
          documentId: 202,
          type: 'Surat Keterangan Domisili',
          requester: 'Rina Wati',
          requesterNik: '3175024309970002',
          subject: 'Permohonan Keterangan Domisili',
          submittedAt: '2024-07-15T15:45:00'
        },
        {
          id: 3,
          documentId: 203,
          type: 'Surat Keterangan Tidak Mampu',
          requester: 'Agus Setiawan',
          requesterNik: '3175020501960003',
          subject: 'Permohonan SKTM untuk Pendidikan',
          submittedAt: '2024-07-15T11:20:00'
        }
      ];
      
      return {
        documents: mockDocuments,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: mockDocuments.length,
          totalPages: 1
        }
      };
    }
  },

  // Get upcoming events for RT
  getRTUpcomingEvents: async (params: { page?: number; limit?: number }) => {
    try {
      const response = await api.get('/rt/events/upcoming', { params });
      return response.data.data as {
        events: UpcomingEvent[],
        pagination: { page: number, limit: number, total: number, totalPages: number }
      };
    } catch (error) {
      console.log('Using mock upcoming events');
      // Mock data for development
      const mockEvents: UpcomingEvent[] = [
        {
          id: 1,
          title: 'Kerja Bakti RT 003',
          description: 'Kerja bakti membersihkan lingkungan RT 003',
          date: '2024-07-21T07:00:00',
          location: 'Jl. Mawar RT 003/002',
          participants: 15,
          isRTEvent: true
        }
      ];
      
      return {
        events: mockEvents,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: mockEvents.length,
          totalPages: 1
        }
      };
    }
  },

  // Process resident verification
  processVerification: async (id: number, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await api.post(`/rt/verifications/${id}/process`, { action, notes });
      return response.data.data;
    } catch (error) {
      console.log(`Using mock verification process: ${action} for ID ${id}`);
      return { success: true };
    }
  },

  // Process document recommendation
  processDocumentRecommendation: async (id: number, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await api.post(`/rt/documents/${id}/recommend`, { action, notes });
      return response.data.data;
    } catch (error) {
      console.log(`Using mock document recommendation: ${action} for ID ${id}`);
      return { success: true };
    }
  },
};

// RW Management API functions
export const rwApi = {
  // Get all RW users
  getAllRWUsers: async () => {
    const response = await api.get('/users/rw');
    // Transform backend data to match frontend expectations
    const transformedData = {
      rwUsers: response.data.data.rwUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        number: user.resident?.rwNumber || '',
        phoneNumber: user.resident?.phoneNumber || '',
        address: user.resident?.address || '',
        isActive: user.resident?.isVerified ?? true,
        createdAt: user.createdAt
      }))
    };
    return transformedData;
  },

  // Create new RW user
  createRWUser: async (data: {
    name: string;
    email: string;
    rwNumber: string;
    phoneNumber?: string;
    address?: string;
  }) => {
    const response = await api.post('/users/rw', data);
    return response.data.data;
  },

  // Update RW user
  updateRWUser: async (id: number, data: {
    name?: string;
    email?: string;
    rwNumber?: string;
    phoneNumber?: string;
    address?: string;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/users/rw/${id}`, data);
    return response.data.data;
  },

  // Delete RW user
  deleteRWUser: async (id: number) => {
    const response = await api.delete(`/users/rw/${id}`);
    return response.data;
  },
};

// Export the axios instance for direct use
export { api };

export default api;
