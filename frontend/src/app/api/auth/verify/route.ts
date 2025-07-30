import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ktpFile = formData.get('ktp') as File;
    const kkFile = formData.get('kk') as File;

    if (!ktpFile || !kkFile) {
      return NextResponse.json(
        { status: 'error', message: 'File KTP dan KK harus diunggah' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'verification');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filenames
    const timestamp = Date.now();
    const ktpFilename = `ktp_${timestamp}_${ktpFile.name}`;
    const kkFilename = `kk_${timestamp}_${kkFile.name}`;

    // Save files
    const ktpBytes = await ktpFile.arrayBuffer();
    const kkBytes = await kkFile.arrayBuffer();

    await writeFile(path.join(uploadsDir, ktpFilename), Buffer.from(ktpBytes));
    await writeFile(path.join(uploadsDir, kkFilename), Buffer.from(kkBytes));

    // In a real implementation, you would:
    // 1. Get user ID from JWT token
    // 2. Update user's verification status in database
    // 3. Store file paths in database
    // 4. Send notification to admin/RT for verification

    return NextResponse.json({
      status: 'success',
      message: 'File berhasil diunggah. Menunggu verifikasi dari admin.',
      data: {
        ktpFile: ktpFilename,
        kkFile: kkFilename
      }
    });

  } catch (error) {
    console.error('Error uploading verification files:', error);
    return NextResponse.json(
      { status: 'error', message: 'Gagal mengunggah file' },
      { status: 500 }
    );
  }
}
