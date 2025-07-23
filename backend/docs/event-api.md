# Events and Activities API

The Events and Activities API provides endpoints for managing community events and activities with role-based access controls.

## Role-Based Access Control

The API implements the following role-based access controls:

1. **Admin**
   - Full access to all events
   - Can create, read, update, and delete any event
   - Can manage participants and event photos
   - Can publish events

2. **RW (Rukun Warga)**
   - Full access to all events
   - Can create, read, update, and delete any event
   - Can manage participants and event photos
   - Can publish events

3. **RT (Rukun Tetangga)**
   - Can create events for their RT
   - Can read all events, but can only manage events for their RT
   - Can manage participants and event photos for events in their RT
   - Can publish events for their RT

4. **Warga (Resident)**
   - Can view published events
   - Can RSVP to events
   - Cannot create, update, or delete events
   - Cannot manage participants or event photos

## API Endpoints

### Get All Events
```
GET /api/events
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: All events
  - RT: Events for their RT and general events
  - Warga: Published events for their RT and general events
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `search`: Search term for title, description, or location
  - `category`: Filter by event category (KERJA_BAKTI, RAPAT, etc.)
  - `startDate`: Filter by start date (minimum)
  - `endDate`: Filter by end date (maximum)
  - `rtNumber`: Filter by RT number
  - `rwNumber`: Filter by RW number

### Get Event Statistics
```
GET /api/events/statistics
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Statistics for all events
  - RT: Statistics for events in their RT
  - Warga: Statistics for events they can access
- **Response**: Statistics including total events, upcoming events, past events, category distribution, and monthly distribution

### Get Event by ID
```
GET /api/events/:id
```
- **Authentication**: Required
- **Access Control**: 
  - Admin/RW: Any event
  - RT: Events for their RT and general events
  - Warga: Published events for their RT and general events

### Get Event Participants
```
GET /api/events/:id/participants
```
- **Authentication**: Required
- **Access Control**: Same as "Get Event by ID"
- **Response**: List of participants grouped by RSVP status (AKAN_HADIR, TIDAK_HADIR, HADIR)

### Create Event
```
POST /api/events
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can create events for any RT
  - RT: Can only create events for their RT
- **Request Body**:
  ```json
  {
    "title": "Kerja Bakti RW 01",
    "description": "Kerja bakti untuk membersihkan lingkungan RW 01",
    "location": "Balai RW 01",
    "startDate": "2023-06-01T08:00:00Z",
    "endDate": "2023-06-01T12:00:00Z",
    "category": "KERJA_BAKTI",
    "isPublished": false,
    "targetRTs": "[\"001\", \"002\"]"
  }
  ```

### Update Event
```
PUT /api/events/:id
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can update any event
  - RT: Can only update events for their RT
  - Event creator: Can update their own events
- **Request Body**: Same as Create Event

### Delete Event
```
DELETE /api/events/:id
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can delete any event
  - RT: Can only delete events for their RT
  - Event creator: Can delete their own events

### RSVP to Event
```
POST /api/events/:id/rsvp
```
- **Authentication**: Required
- **Access Control**: Any authenticated user can RSVP to events they can access
- **Request Body**:
  ```json
  {
    "status": "AKAN_HADIR"
  }
  ```
- **RSVP Status Options**:
  - `AKAN_HADIR`: Will attend
  - `TIDAK_HADIR`: Will not attend
  - `HADIR`: Attended

### Update Participant Status
```
PUT /api/events/:id/participants/:userId
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can update participants for any event
  - RT: Can only update participants for events in their RT
  - Event creator: Can update participants for their own events
- **Request Body**:
  ```json
  {
    "status": "HADIR"
  }
  ```

### Add Photo to Event
```
POST /api/events/:id/photos
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can add photos to any event
  - RT: Can only add photos to events in their RT
  - Event creator: Can add photos to their own events
- **Request Body**:
  ```json
  {
    "photoUrl": "https://example.com/photo.jpg",
    "caption": "Kerja bakti bersama warga"
  }
  ```

### Delete Photo from Event
```
DELETE /api/events/:id/photos/:photoId
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can delete photos from any event
  - RT: Can only delete photos from events in their RT
  - Event creator: Can delete photos from their own events

### Publish Event
```
POST /api/events/:id/publish
```
- **Authentication**: Required
- **Authorization**: Admin, RW, RT
- **Access Control**: 
  - Admin/RW: Can publish any event
  - RT: Can only publish events in their RT
  - Event creator: Can publish their own events

## Event Categories

- `KERJA_BAKTI`: Community service
- `RAPAT`: Meeting
- `ARISAN`: Social gathering with lottery
- `KEAGAMAAN`: Religious event
- `OLAHRAGA`: Sports event
- `PERAYAAN`: Celebration
- `LAINNYA`: Other

## RSVP Statuses

- `AKAN_HADIR`: Will attend
- `TIDAK_HADIR`: Will not attend
- `HADIR`: Attended 