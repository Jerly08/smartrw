import { PrismaClient, DocumentType, DocumentStatus } from '@prisma/client';
import { ApiError } from '../middleware/error.middleware';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

// Interface for document creation/update
interface DocumentInput {
  type: DocumentType;
  subject: string;
  description: string;
  attachments?: string; // JSON string of file paths
}

// Get all documents with filtering
export const getAllDocuments = async (
  params: {
    page?: number;
    limit?: number;
  search?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  requesterId?: number;
  rtNumber?: string;
  } = {}
) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    type, 
    status,
    requesterId,
    rtNumber
  } = params;
  
  const skip = (page - 1) * limit;
  
  // Build where conditions
  const where: any = {};
  
  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { description: { contains: search } },
    ];
  }
  
  if (type) {
    where.type = type;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (requesterId) {
    where.requesterId = requesterId;
  }
  
  // Filter by RT if specified
  if (rtNumber) {
    where.requester = {
      resident: {
        rtNumber,
      },
    };
  }
  
  // Get total count for pagination
  const total = await prisma.document.count({ where });
  
  // Get documents
  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          resident: {
            select: {
              id: true,
              fullName: true,
              rtNumber: true,
              rwNumber: true,
            },
          },
        },
      },
    },
  });
  
  return {
    documents,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get document by ID
export const getDocumentById = async (id: number) => {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          resident: {
            select: {
              id: true,
              fullName: true,
              rtNumber: true,
              rwNumber: true,
            },
          },
        },
      },
    },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  return document;
};

// Create new document
export const createDocument = async (data: DocumentInput, requesterId: number) => {
  // Check if user has resident data
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: {
      resident: true,
    },
  });
  
  if (!requester) {
    throw new ApiError('User not found', 404);
  }
  
  if (!requester.resident) {
    throw new ApiError('User must have resident profile to create document', 400);
  }
  
  // Create document
  const document = await prisma.document.create({
    data: {
      ...data,
      requesterId,
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          resident: true,
        },
      },
    },
  });
  
  // Create notification for document submission
  await notificationService.createNotification({
    userId: requesterId,
    type: 'DOCUMENT',
    title: 'Pengajuan Surat',
    message: `Surat ${document.type} Anda telah diajukan dan sedang dalam proses`,
    priority: 'NORMAL',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: document.status,
    },
  });

  // Send notification to RT users
  try {
    await createDocumentNotificationsForRT(document);
  } catch (error) {
    console.error('Error creating document notifications for RT:', error);
    // Don't fail the document creation if notification fails
  }
  
  return document;
};

// Helper function to create notifications for RT users when documents need verification
async function createDocumentNotificationsForRT(document: any) {
  try {
    // Get the document requester's RT and RW
    if (!document.requester?.resident) {
      // Try to fetch resident data if not included
      const requester = await prisma.user.findUnique({
        where: { id: document.requesterId },
        include: {
          resident: true,
        },
      });
      
      if (!requester?.resident) {
        console.error('Requester resident data not found');
        return;
      }
      
      document.requester = requester;
    }
    
    const { rtNumber, rwNumber } = document.requester.resident;
    
    // Get all RT users for the requester's RT
    const rtUsers = await prisma.user.findMany({
      where: {
        role: 'RT',
        resident: {
          rtNumber,
          rwNumber,
        },
      },
    });
    
    // Create notifications for RT users
    for (const rtUser of rtUsers) {
      await prisma.notification.create({
        data: {
          userId: rtUser.id,
          type: 'DOCUMENT',
          title: 'Dokumen Memerlukan Verifikasi RT',
          message: `Dokumen ${document.type} dari ${document.requester.name} memerlukan verifikasi Anda`,
          priority: 'HIGH',
          documentId: document.id,
          data: JSON.stringify({
            documentId: document.id,
            documentType: document.type,
            documentSubject: document.subject,
            requesterName: document.requester.name,
            requesterNik: document.requester.resident.nik,
          }),
        },
      });
    }
  } catch (error) {
    console.error('Error creating document notifications for RT:', error);
  }
}

// Update document status
export const updateDocumentStatus = async (
  id: number,
  status: DocumentStatus,
  notes?: string,
  updatedByUserId?: number
) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      requester: true,
    },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === 'DITOLAK' ? notes : undefined,
    },
  });
  
  // Create notification for status update
  let notificationTitle = 'Status Pengajuan Surat';
  let notificationMessage = '';
  
  switch (status) {
    case 'DIPROSES':
      notificationMessage = `Surat ${document.type} Anda sedang diproses`;
      break;
    case 'DITOLAK':
      notificationMessage = `Surat ${document.type} Anda ditolak. Alasan: ${notes || 'Tidak ada alasan yang diberikan'}`;
      break;
    case 'DISETUJUI':
      notificationMessage = `Surat ${document.type} Anda telah disetujui`;
      break;
    case 'DITANDATANGANI':
      notificationMessage = `Surat ${document.type} Anda telah ditandatangani`;
      break;
    case 'SELESAI':
      notificationMessage = `Surat ${document.type} Anda telah selesai dan siap diambil`;
      break;
    default:
      notificationMessage = `Status surat ${document.type} Anda telah diperbarui menjadi ${status}`;
  }
  
  await notificationService.createNotification({
    userId: document.requesterId,
    type: 'DOCUMENT',
    title: notificationTitle,
    message: notificationMessage,
    priority: status === 'SELESAI' ? 'HIGH' : 'NORMAL',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: status,
      notes: notes,
    },
  });
  
  return updatedDocument;
};

// Approve document
export const approveDocument = async (id: number, approvedBy: string) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: { id },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status: 'DISETUJUI',
      approvedBy,
      approvedAt: new Date(),
    },
  });
  
  // Create notification for approval
  await notificationService.createNotification({
    userId: document.requesterId,
    type: 'DOCUMENT',
    title: 'Surat Disetujui',
    message: `Surat ${document.type} Anda telah disetujui`,
    priority: 'NORMAL',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: 'DISETUJUI',
      approvedBy,
    },
  });
  
  return updatedDocument;
};

// Reject document
export const rejectDocument = async (id: number, reason: string) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: { id },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status: 'DITOLAK',
      rejectionReason: reason,
    },
  });
  
  // Create notification for rejection
  await notificationService.createNotification({
    userId: document.requesterId,
    type: 'DOCUMENT',
    title: 'Surat Ditolak',
    message: `Surat ${document.type} Anda ditolak. Alasan: ${reason || 'Tidak ada alasan yang diberikan'}`,
    priority: 'HIGH',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: 'DITOLAK',
      rejectionReason: reason,
      },
    });
    
  return updatedDocument;
};

// Sign document
export const signDocument = async (id: number, signedBy: string) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: { id },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status: 'DITANDATANGANI',
      signedBy,
      signedAt: new Date(),
    },
  });
  
  // Create notification for signing
  await notificationService.createNotification({
    userId: document.requesterId,
    type: 'DOCUMENT',
    title: 'Surat Ditandatangani',
    message: `Surat ${document.type} Anda telah ditandatangani oleh ${signedBy}`,
    priority: 'NORMAL',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: 'DITANDATANGANI',
      signedBy,
    },
  });
  
  return updatedDocument;
};

// Complete document
export const completeDocument = async (id: number) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: { id },
  });
  
  if (!document) {
    throw new ApiError('Document not found', 404);
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status: 'SELESAI',
      completedAt: new Date(),
    },
  });
  
  // Create notification for completion
  await notificationService.createNotification({
    userId: document.requesterId,
    type: 'DOCUMENT',
    title: 'Surat Selesai',
    message: `Surat ${document.type} Anda telah selesai dan siap diambil`,
    priority: 'HIGH',
    documentId: document.id,
    data: {
      documentType: document.type,
      documentSubject: document.subject,
      documentStatus: 'SELESAI',
    },
  });
  
  return updatedDocument;
}; 