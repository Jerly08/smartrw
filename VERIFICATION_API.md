# API Verifikasi Warga - Smart RW

## Overview

Fitur verifikasi warga memungkinkan user yang sudah register untuk melengkapi data pribadi mereka dan memilih RT tempat mereka tinggal. Data warga akan tersimpan di RT yang dipilih dan dapat diverifikasi oleh pengurus RT.

## Endpoints

### 1. Get Available RTs

**GET** `/api/auth/rts`

Mendapatkan daftar RT yang tersedia untuk dipilih warga.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "status": "success",
  "data": {
    "rts": [
      {
        "id": 1,
        "number": "001",
        "name": "RT 001 Kelurahan Merdeka",
        "description": "RT di wilayah utara",
        "address": "Jl. Merdeka Utara",
        "chairperson": "Pak Bambang",
        "phoneNumber": "081234567890",
        "_count": {
          "residents": 25
        }
      }
    ]
  }
}
```

### 2. Verify Resident Data

**POST** `/api/auth/verify-resident`

Verifikasi data warga dengan pilihan RT.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "birthDate": "1990-05-15",
  "address": "Jl. Merdeka No. 123, Jakarta Pusat",
  "rtId": 1
}
```

**Validation Rules:**
- `name`: string, minimal 2 karakter, required
- `birthDate`: string format date (YYYY-MM-DD), required
- `address`: string, minimal 5 karakter, required
- `rtId`: number, positive, required

**Response Success:**
```json
{
  "status": "success",
  "message": "Verifikasi berhasil, data warga telah tersimpan di RT yang dipilih",
  "data": {
    "resident": {
      "id": 15,
      "nik": "TEMP1234567890",
      "fullName": "Budi Santoso",
      "birthDate": "1990-05-15T00:00:00.000Z",
      "address": "Jl. Merdeka No. 123, Jakarta Pusat",
      "rtNumber": "001",
      "isVerified": true,
      "verifiedBy": "System - RT 001",
      "verifiedAt": "2024-01-15T10:30:00.000Z",
      "rt": {
        "id": 1,
        "number": "001",
        "name": "RT 001 Kelurahan Merdeka"
      }
    },
    "rt": {
      "id": 1,
      "number": "001",
      "name": "RT 001 Kelurahan Merdeka"
    }
  }
}
```

**Response Error (Already Verified):**
```json
{
  "status": "error",
  "message": "User sudah memiliki data warga yang terverifikasi"
}
```

**Response Error (RT Not Found):**
```json
{
  "status": "error",
  "message": "RT tidak ditemukan atau tidak aktif"
}
```

**Response Error (Validation):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "path": "name",
      "message": "Nama lengkap harus minimal 2 karakter"
    }
  ]
}
```

## Frontend Implementation

### 1. Komponen Form Verifikasi

Komponen `VerifyResidentForm` telah dibuat dengan fitur:

- **Form fields:** nama, tanggal lahir, alamat, pilihan RT
- **RT Selection:** Dropdown dengan informasi RT (nomor, nama, ketua, jumlah warga)
- **Real-time validation:** Error handling dan validation feedback
- **Loading states:** Loading indicator saat fetch data dan submit
- **RT Preview:** Menampilkan detail RT yang dipilih
- **Responsive design:** Mobile-friendly dengan Tailwind CSS

### 2. Halaman Verifikasi

Halaman `/verify` dengan fitur:
- Authentication check
- Loading state
- Integration dengan VerifyResidentForm component

## Database Schema Changes

### Resident Model Updates

Data resident yang dibuat otomatis mencakup:

```javascript
{
  nik: "TEMP{userId}{timestamp}", // Placeholder NIK
  noKK: "KK{userId}{timestamp}",  // Placeholder KK
  fullName: "from form input",
  gender: "LAKI_LAKI",            // Default (should be from form)
  birthPlace: "Unknown",          // Default (should be from form)
  birthDate: "from form input",
  address: "from form input",
  rtNumber: "from selected RT",
  rwNumber: "001",                // Default RW
  religion: "ISLAM",              // Default (should be from form)
  maritalStatus: "BELUM_KAWIN",   // Default (should be from form)
  userId: "current user id",
  rtId: "from form input",
  isVerified: true,
  verifiedBy: "System - RT {number}",
  verifiedAt: "current timestamp"
}
```

## Usage Flow

1. **User Registration:** User melakukan register dengan email, password, dan nama
2. **Get Available RTs:** Frontend memanggil `/api/auth/rts` untuk mendapatkan daftar RT
3. **Fill Verification Form:** User mengisi nama lengkap, tanggal lahir, alamat, dan memilih RT
4. **Submit Verification:** Frontend mengirim data ke `/api/auth/verify-resident`
5. **Data Saved:** Data resident tersimpan di database dan terhubung dengan RT yang dipilih
6. **Access Granted:** User dapat mengakses fitur-fitur lain dalam sistem

## Security Considerations

- **Authentication Required:** Semua endpoint memerlukan valid JWT token
- **Data Validation:** Server-side validation untuk semua input
- **RT Verification:** Memastikan RT yang dipilih aktif dan tersedia
- **Single Verification:** User hanya dapat melakukan verifikasi sekali
- **Transaction Safety:** Menggunakan database transaction untuk data consistency

## Error Handling

- **Authentication Errors:** 401 jika token tidak valid
- **Validation Errors:** 400 dengan detail error untuk setiap field
- **Not Found Errors:** 404 jika RT tidak ditemukan
- **Business Logic Errors:** 400 untuk kondisi seperti user sudah terverifikasi

## Testing

Script test `test-verification.js` tersedia untuk menguji:
- Flow registrasi dan verifikasi lengkap
- Error handling untuk user yang sudah terverifikasi
- Validation error handling
- Integration dengan database

Jalankan test dengan:
```bash
node test-verification.js
```

## Future Enhancements

1. **Extended Form Fields:** Tambah field jenis kelamin, agama, status pernikahan, dll.
2. **File Upload:** Upload foto KTP/KK untuk verifikasi
3. **RT Approval:** Sistem approval dari ketua RT sebelum verifikasi final
4. **Data Import:** Import data warga dari sistem eksternal
5. **Verification Status:** Multiple status verifikasi (pending, approved, rejected)
6. **Notification System:** Notifikasi ke RT ketika ada warga baru yang mendaftar
