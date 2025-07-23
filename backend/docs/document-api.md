# Document Administration API

The Document Administration API provides endpoints for managing document requests with role-based access controls.

## Document Workflow

The document request process follows this workflow:

1. **DIAJUKAN (Submitted)**: Resident submits a document request
2. **DIPROSES (In Process)**: RT reviews and recommends the document
3. **DITOLAK (Rejected)**: RT or RW/Admin rejects the document with reason
4. **DISETUJUI (Approved)**: RW/Admin approves the document
5. **DITANDATANGANI (Signed)**: RW/Admin digitally signs the document
6. **SELESAI (Completed)**: Document is ready for pickup/download

## Role-Based Access Control

The API implements the following role-based access controls:

1. **Admin**
   - Full access to all documents
   - Can approve, reject, sign, and manage all documents
   - Can view statistics for all documents

2. **RW (Rukun Warga)**
   - Full access to all documents
   - Can approve, reject, sign, and manage all documents
   - Can view statistics for all documents

3. **RT (Rukun Tetangga)**
   - Access limited to documents from residents in their RT
   - Can recommend (process) or reject documents from their RT
   - Cannot approve, sign, or complete documents
   - Can view statistics for documents from their RT

4. **Warga (Resident)**
   - Can create document requests
   - Can view and update their own document requests
   - Can delete their own document requests (only if in DIAJUKAN or DITOLAK status)
   - Can view statistics for their own documents

## API Endpoints

### Get All Documents
```
GET /api/documents
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: All documents
  - RT: Only documents from residents in their RT
  - Warga: Only their own documents
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `search`: Search term for subject or description
  - `type`: Filter by document type (DOMISILI, PENGANTAR_SKCK, etc.)
  - `status`: Filter by document status (DIAJUKAN, DIPROSES, etc.)
  - `startDate`: Filter by creation date (start)
  - `endDate`: Filter by creation date (end)

### Get Document Statistics
```
GET /api/documents/statistics
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Statistics for all documents
  - RT: Statistics for documents from residents in their RT
  - Warga: Statistics for their own documents
- **Response**: Statistics including total documents, status distribution, type distribution, and monthly distribution

### Get Document by ID
```
GET /api/documents/:id
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Any document
  - RT: Only documents from residents in their RT
  - Warga: Only their own documents

### Create Document
```
POST /api/documents
```
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "type": "DOMISILI",
    "subject": "Surat Keterangan Domisili",
    "description": "Surat keterangan domisili untuk keperluan administrasi",
    "attachments": "[\"url1\", \"url2\"]"
  }
  ```

### Update Document
```
PUT /api/documents/:id
```
- **Authentication**: Required
- **Access Control**: Only the document requester can update their own documents
- **Restrictions**: Documents can only be updated if they are in DIAJUKAN or DITOLAK status
- **Request Body**: Same as Create Document

### Process Document
```
POST /api/documents/:id/process
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can process any document to any status (following workflow)
  - RT: Can only process documents from their RT to DIPROSES or DITOLAK status
- **Request Body**:
  ```json
  {
    "status": "DIPROSES",
    "notes": "Optional notes or rejection reason"
  }
  ```

### Delete Document
```
DELETE /api/documents/:id
```
- **Authentication**: Required
- **Access Control**: Only the document requester can delete their own documents
- **Restrictions**: Documents can only be deleted if they are in DIAJUKAN or DITOLAK status

## Document Types

- `DOMISILI`: Domicile certificate
- `PENGANTAR_SKCK`: Police record certificate introduction letter
- `TIDAK_MAMPU`: Certificate of financial incapacity
- `USAHA`: Business certificate
- `KELAHIRAN`: Birth certificate
- `KEMATIAN`: Death certificate
- `PINDAH`: Moving certificate
- `LAINNYA`: Other types

## Document Statuses

- `DIAJUKAN`: Submitted
- `DIPROSES`: In process (recommended by RT)
- `DITOLAK`: Rejected
- `DISETUJUI`: Approved
- `DITANDATANGANI`: Signed
- `SELESAI`: Completed 