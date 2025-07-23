# Complaints and Aspirations API

The Complaints and Aspirations API provides endpoints for handling resident complaints and aspirations with role-based access controls.

## Role-Based Access Control

The API implements the following role-based access controls:

1. **Admin**
   - Full access to all complaints
   - Can create, read, update, and delete any complaint
   - Can respond to any complaint

2. **RW (Rukun Warga)**
   - Full access to all complaints
   - Can create, read, update, and delete any complaint
   - Can respond to any complaint

3. **RT (Rukun Tetangga)**
   - Can create complaints
   - Can read and respond to complaints from residents in their RT
   - Cannot access complaints from other RTs

4. **Warga (Resident)**
   - Can create complaints
   - Can read, update, and delete their own complaints
   - Can only update or delete complaints that are still in DITERIMA status
   - Cannot respond to complaints

## API Endpoints

### Get All Complaints
```
GET /api/complaints
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: All complaints
  - RT: Complaints from their RT
  - Warga: Only their own complaints
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `search`: Search term for title, description, or location
  - `category`: Filter by complaint category (LINGKUNGAN, KEAMANAN, etc.)
  - `status`: Filter by complaint status (DITERIMA, DITINDAKLANJUTI, etc.)
  - `startDate`: Filter by creation date (minimum)
  - `endDate`: Filter by creation date (maximum)
  - `rtNumber`: Filter by RT number
  - `rwNumber`: Filter by RW number

### Get Complaint Statistics
```
GET /api/complaints/statistics
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Statistics for all complaints
  - RT: Statistics for complaints in their RT
  - Warga: Statistics for their own complaints
- **Response**: Statistics including total complaints, complaints by status, complaints by category, and monthly distribution

### Get Complaint by ID
```
GET /api/complaints/:id
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Any complaint
  - RT: Complaints from their RT
  - Warga: Only their own complaints

### Create Complaint
```
POST /api/complaints
```
- **Authentication**: Required
- **Access Control**: All authenticated users can create complaints
- **Request Body**:
  ```json
  {
    "category": "LINGKUNGAN",
    "title": "Jalan Rusak",
    "description": "Jalan di depan rumah saya rusak dan berlubang",
    "location": "Jalan Merdeka No. 10",
    "attachments": "[\"path/to/photo1.jpg\", \"path/to/photo2.jpg\"]"
  }
  ```

### Update Complaint
```
PUT /api/complaints/:id
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Any complaint
  - RT: Complaints from their RT
  - Warga: Only their own complaints (if still in DITERIMA status)
- **Request Body**: Same as Create Complaint, all fields optional

### Delete Complaint
```
DELETE /api/complaints/:id
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Any complaint
  - Warga: Only their own complaints (if still in DITERIMA status)

### Respond to Complaint
```
POST /api/complaints/:id/respond
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Any complaint
  - RT: Only complaints from their RT
- **Request Body**:
  ```json
  {
    "response": "Kami akan segera memperbaiki jalan tersebut",
    "status": "DITINDAKLANJUTI"
  }
  ```
- **Status Options**:
  - `DITINDAKLANJUTI`: Being processed
  - `SELESAI`: Completed
  - `DITOLAK`: Rejected

## Complaint Categories

- `LINGKUNGAN`: Environment-related complaints (trash, pollution, etc.)
- `KEAMANAN`: Security-related complaints (theft, suspicious activity, etc.)
- `SOSIAL`: Social-related complaints (noise, disturbances, etc.)
- `INFRASTRUKTUR`: Infrastructure-related complaints (roads, lighting, etc.)
- `ADMINISTRASI`: Administration-related complaints (services, procedures, etc.)
- `LAINNYA`: Other complaints

## Complaint Statuses

- `DITERIMA`: Received (initial status)
- `DITINDAKLANJUTI`: Being processed
- `SELESAI`: Completed
- `DITOLAK`: Rejected 