import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import residentRoutes from './routes/resident.routes';
import familyRoutes from './routes/family.routes';
import documentRoutes from './routes/document.routes';
import eventRoutes from './routes/event.routes';
import complaintRoutes from './routes/complaint.routes';
import socialAssistanceRoutes from './routes/socialAssistance.routes';
import forumRoutes from './routes/forum.routes';
import notificationRoutes from './routes/notification.routes';
import rtRoutes from './routes/rt.routes';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/social-assistance', socialAssistanceRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rt', rtRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

export default app; 