# SmartRW

A comprehensive community management system for Rukun Warga (RW) administration.

## Project Structure

```
smart_rw/
├── frontend/               # Next.js frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── app/            # Next.js app directory
│       ├── components/     # React components
│       └── lib/            # Utility functions
│
└── backend/                # Express.js backend
    ├── prisma/             # Prisma schema and migrations
    └── src/
        ├── controllers/    # Request handlers
        ├── middleware/     # Express middleware
        ├── routes/         # API routes
        ├── services/       # Business logic
        └── utils/          # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL (v8+)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
# Configure your MySQL connection in .env file
npx prisma migrate dev --name init
npm run dev
```

## Features

- User management with different roles (admin, RW, RT, warga)
- Resident data management
- Document and letter administration
- Community events and activities
- Complaints handling
- Social assistance program management
- Digital communication forum 