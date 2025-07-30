# Flow Register Warga - Smart RW

## Overview
Fitur `Flow.register.warga` memungkinkan warga untuk mendaftar sendiri ke dalam sistem Smart RW dengan mengisi data pribadi lengkap. Setelah mendaftar, data warga akan menunggu verifikasi dari RT setempat.

## Flow Pendaftaran

### 1. Frontend Registration Flow
```
User Access -> /register/warga -> RegisterWargaForm -> API Call -> Backend Processing
```

**Components:**
- `RegisterWargaForm.tsx`: Form multi-step untuk input data warga
- `/register/warga/page.tsx`: Halaman pendaftaran warga
- `/api/auth/register/warga/route.ts`: API route frontend

### 2. Backend Processing Flow
```
API Request -> Validation -> User Creation -> Resident Creation -> Notification -> Response
```

**Backend Files:**
- Route: `auth.routes.js` - `POST /api/auth/register/warga`
- Controller: `auth.controller.js` - `registerWarga()`
- Service: `auth.service.js` - `registerWarga()`
- Schema: `auth.schema.js` - `registerWargaSchema`

## Form Fields

### Step 1: Informasi Akun
- **Email** (required): Email untuk login
- **Password** (required): Password minimal 6 karakter
- **Confirm Password** (required): Konfirmasi password
- **Full Name** (required): Nama lengkap sesuai KTP

### Step 2: Data Pribadi
- **NIK** (required): 16 digit NIK
- **No. KK** (required): 16 digit Nomor Kartu Keluarga
- **Gender** (required): LAKI_LAKI / PEREMPUAN
- **Birth Place** (required): Tempat lahir
- **Birth Date** (required): Tanggal lahir

### Step 3: Alamat & Detail
- **Address** (required): Alamat lengkap
- **RT Number** (required): Nomor RT
- **RW Number** (required): Nomor RW
- **Religion** (required): Agama
- **Marital Status** (required): Status perkawinan
- **Occupation** (optional): Pekerjaan
- **Education** (optional): Pendidikan terakhir
- **Phone Number** (optional): Nomor telepon
- **Domicile Status** (optional): Status domisili
- **Vaccination Status** (optional): Status vaksinasi
- **Family Role** (optional): Role dalam keluarga

## Backend Implementation

### 1. Authentication Service
```javascript
// registerWarga service creates both User and Resident records
const registerWarga = async (userData) => {
  // Validate email and NIK uniqueness
  // Hash password
  // Create user with WARGA role
  // Create resident profile
  // Send notifications to RT
  // Return user, resident, and token
}
```

### 2. Database Transaction
- Creates User record with role 'WARGA'
- Creates Resident record linked to User
- Sets `isVerified: false` (requires RT verification)
- Uses Prisma transaction for atomicity

### 3. Notifications
Automatically creates notifications for RT users in the same RT/RW when new warga registers.

## Validation Rules

### Required Fields
- Email (valid email format)
- Password (min 6 characters)
- NIK (exactly 16 digits, unique)
- No. KK (exactly 16 digits)
- Full Name (min 2 characters)
- Gender, Birth Place, Birth Date
- Address (min 5 characters)
- RT Number, RW Number
- Religion, Marital Status

### Optional Fields
- Occupation, Education, Phone Number
- Domicile Status, Vaccination Status, Family Role

## Security Features

1. **Password Hashing**: Uses bcrypt with salt
2. **JWT Token**: Generated after successful registration
3. **Input Validation**: Zod schema validation on both frontend and backend
4. **Unique Constraints**: Email and NIK must be unique
5. **Role-based Access**: New users get 'WARGA' role

## Post-Registration Flow

1. **Success Response**: Returns user data, resident data, and JWT token
2. **Auto-Login**: User is automatically logged in after registration
3. **Dashboard Redirect**: Redirects to `/dashboard?registered=true`
4. **RT Notification**: RT users receive notification for verification
5. **Verification Required**: Resident profile shows `isVerified: false` until RT verifies

## API Endpoints

### POST /api/auth/register/warga
**Request Body:**
```json
{
  "email": "warga@example.com",
  "password": "password123",
  "nik": "1234567890123456",
  "noKK": "1234567890123456",
  "fullName": "John Doe",
  "gender": "LAKI_LAKI",
  "birthPlace": "Jakarta",
  "birthDate": "1990-01-01",
  "address": "Jl. Example No. 123",
  "rtNumber": "001",
  "rwNumber": "001",
  "religion": "ISLAM",
  "maritalStatus": "KAWIN",
  // ... optional fields
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Warga berhasil didaftarkan. Menunggu verifikasi RT.",
  "data": {
    "user": {
      "id": 1,
      "email": "warga@example.com",
      "name": "John Doe",
      "role": "WARGA"
    },
    "resident": {
      "id": 1,
      "nik": "1234567890123456",
      "fullName": "John Doe",
      "isVerified": false,
      // ... other resident fields
    },
    "token": "jwt-token-here"
  }
}
```

## Error Handling

### Common Errors:
- **400**: Validation errors (missing fields, invalid format)
- **400**: Email already in use
- **400**: NIK already registered
- **500**: Server errors

### Frontend Error Display:
- Form validation errors shown inline
- API errors shown via toast notifications
- Network errors handled gracefully

## Integration Points

### 1. RT Dashboard
RT users receive notifications when new warga registers in their area and can verify the resident from their dashboard.

### 2. Resident Management
Registered warga appears in resident management with `isVerified: false` status until RT verification.

### 3. Authentication System
Uses same JWT token system as other user types for consistent authentication.

## Testing

### Manual Testing Checklist:
- [ ] Form validation works for all required fields
- [ ] Multi-step navigation works correctly
- [ ] Duplicate email/NIK validation
- [ ] Successful registration and auto-login
- [ ] RT notification creation
- [ ] Database record creation (User + Resident)
- [ ] JWT token generation and storage

### Test Data Example:
```javascript
const testWargaData = {
  email: "test.warga@example.com",
  password: "password123",
  nik: "1234567890123456",
  noKK: "9876543210987654",
  fullName: "Test Warga",
  gender: "LAKI_LAKI",
  birthPlace: "Jakarta",
  birthDate: "1990-01-01",
  address: "Jl. Test No. 123, Jakarta",
  rtNumber: "001",
  rwNumber: "001",
  religion: "ISLAM",
  maritalStatus: "BELUM_KAWIN"
};
```

## Future Enhancements

1. **Email Verification**: Add email verification step before account activation
2. **Document Upload**: Allow upload of KTP/KK documents for verification
3. **Family Linking**: Automatic family member linking based on KK number
4. **SMS Verification**: Add phone number verification via SMS
5. **Address Validation**: Integration with address APIs for validation
6. **Duplicate Detection**: More sophisticated duplicate resident detection

## Deployment Notes

1. **Environment Variables**: Ensure `JWT_SECRET` is set in production
2. **Database**: Run migrations for User and Resident tables
3. **API URLs**: Update `NEXT_PUBLIC_API_URL` for production
4. **Notifications**: Test notification system with RT users
5. **SSL**: Ensure HTTPS for production to protect sensitive data
