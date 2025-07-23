// Dashboard types

// RT Dashboard statistics
export interface RTDashboardStats {
  rtNumber: string;
  rwNumber: string;
  residents: {
    total: number;
    verified: number;
    unverified: number;
    families: number;
  };
  documents: {
    pending: number;
    total: number;
  };
  complaints: {
    open: number;
    total: number;
  };
  events: {
    upcoming: number;
  };
}

// Pending verification
export interface PendingVerification {
  id: number;
  residentId: number;
  name: string;
  nik: string;
  address: string;
  rtNumber: string;
  rwNumber: string;
  submittedAt: string;
  photoUrl?: string;
}

// Pending document
export interface PendingDocument {
  id: number;
  documentId: number;
  type: string;
  requester: string;
  requesterNik: string;
  subject: string;
  submittedAt: string;
}

// Upcoming event
export interface UpcomingEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  participants: number;
  isRTEvent: boolean;
}

// RW Dashboard statistics
export interface RWDashboardStats {
  rwNumber: string;
  residents: {
    total: number;
    verified: number;
    unverified: number;
    families: number;
  };
  rts: {
    total: number;
    active: number;
  };
  documents: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
  events: {
    upcoming: number;
    total: number;
  };
  socialAssistance: {
    active: number;
    total: number;
  };
}

// Admin Dashboard statistics
export interface AdminDashboardStats {
  residents: {
    total: number;
    verified: number;
    unverified: number;
    families: number;
  };
  rws: {
    total: number;
    active: number;
  };
  rts: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    admin: number;
    rw: number;
    rt: number;
    warga: number;
  };
  documents: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
  events: {
    upcoming: number;
    total: number;
  };
  socialAssistance: {
    active: number;
    total: number;
  };
}

// Warga Dashboard statistics
export interface WargaDashboardStats {
  notifications: {
    unread: number;
    total: number;
  };
  documents: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  events: {
    upcoming: number;
  };
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
} 