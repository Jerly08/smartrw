export enum NotificationType {
  DOCUMENT = 'DOCUMENT',
  COMPLAINT = 'COMPLAINT',
  EVENT = 'EVENT',
  SOCIAL_ASSISTANCE = 'SOCIAL_ASSISTANCE',
  FORUM = 'FORUM',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  scheduledFor?: string;
  expiresAt?: string;
  data?: string; // JSON string that needs to be parsed
  
  // Related entities
  eventId?: number;
  event?: {
    id: number;
    title: string;
    startDate: string;
    category: string;
  };
  
  documentId?: number;
  document?: {
    id: number;
    type: string;
    subject: string;
    status: string;
  };
  
  complaintId?: number;
  complaint?: {
    id: number;
    title: string;
    status: string;
  };
  
  forumPostId?: number;
  forumPost?: {
    id: number;
    title: string;
    category: string;
  };
  
  socialAssistanceId?: number;
  socialAssistance?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// RT-specific notification data types
export interface DocumentNotificationData {
  documentId: number;
  documentType: string;
  documentSubject: string;
  documentStatus: string;
  requesterName?: string;
  requesterNik?: string;
  notes?: string;
}

export interface ResidentVerificationData {
  residentId: number;
  residentName: string;
  residentNik: string;
  residentAddress: string;
}

export interface SocialAssistanceNotificationData {
  assistanceId: number;
  assistanceName: string;
  assistanceType: string;
  recipientId?: number;
  residentName?: string;
  residentNik?: string;
  residentAddress?: string;
}

export interface ComplaintNotificationData {
  complaintId: number;
  complaintTitle?: string;
  complaintCategory?: string;
  complaintStatus?: string;
}

export interface EventNotificationData {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
} 