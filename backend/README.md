# Smart RW Backend

Backend API for the Smart RW application.

## Database Seeding

To populate the database with test data for role-based testing, follow these steps:

### Prerequisites

- Make sure your database connection is properly configured in `.env` file
- Install all dependencies with `npm install`

### Running the Seed Script

Execute the following command in the backend directory:

```bash
npx prisma db seed
```

This will populate your database with:

1. Test users for each role:
   - Admin: admin@smartrw.com / admin123
   - RW: rw@smartrw.com / rw123
   - RT 001: rt001@smartrw.com / rt123
   - RT 002: rt002@smartrw.com / rt123
   - Warga RT 001: warga001@smartrw.com / warga123
   - Warga RT 002: warga002@smartrw.com / warga123

2. Test families and residents:
   - 3 families with family members
   - Verified and unverified residents for testing verification functionality

### Testing Role-Based Features

You can now log in with the different user accounts to test the role-based features:

1. **Admin/RW**: Full access to all resident data, can add/edit/delete/verify residents, and import/export data
2. **RT**: Can only view and edit limited fields for residents in their RT, and verify unverified residents
3. **Warga**: Can only view their personal data and family members, and request updates to their information

## Development

To start the development server:

```bash
npm run dev
```

## Building for Production

```bash
npm run build
npm start
``` 