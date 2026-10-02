import { handleUpload } from '@vercel/blob/client';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://japan.pythonanywhere.com/api').replace(/\/$/, '');
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

/**
 * Verify the caller is an authenticated admin/staff user.
 * We forward the access token to the backend's /auth/me and check is_staff/is_superuser.
 */
async function requireAdmin(request) {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
        // Also try Authorization header as a fallback (curl or script calling BFF token)
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.slice(7);
        }
    }

    if (!accessToken) {
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });

        if (!res.ok) return null;

        const user = await res.json();
        if (user && (user.is_staff || user.is_superuser)) {
            return user;
        }
        return null;
    } catch (e) {
        console.error('[upload] Admin verification failed:', e.message);
        return null;
    }
}

export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json(
                { error: 'Admin authentication required for media uploads.' },
                { status: 401 }
            );
        }

        const contentType = request.headers.get('content-type') || '';

        // Case 1: Direct multipart form data upload
        if (contentType.includes('multipart/form-data')) {
            const contentLength = Number(request.headers.get('content-length'));
            if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_SIZE) {
                return NextResponse.json({ error: 'File too large. Max 25MB.' }, { status: 413 });
            }
            const formData = await request.formData();
            const file = formData.get('file');
            const folder = formData.get('folder') || 'media';

            if (!file || typeof file === 'string') {
                return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
            }
            if (file.size > MAX_UPLOAD_SIZE) {
                return NextResponse.json({ error: 'File too large. Max 25MB.' }, { status: 413 });
            }
            if (file.size > MAX_UPLOAD_SIZE) {
                return NextResponse.json({ error: 'File too large. Max 25MB.' }, { status: 413 });
            }

            // Stricter folder whitelist to prevent arbitrary path writes
            const allowedFolders = ['media', 'blog', 'audio', 'images', 'documents'];
            const safeFolder = allowedFolders.includes(folder) ? folder : 'media';

            const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const pathname = `${safeFolder}/${Date.now()}-${cleanFileName}`;

            const blob = await put(pathname, file, {
                access: 'public',
                addRandomSuffix: true,
            });

            return NextResponse.json({
                url: blob.url,
                downloadUrl: blob.downloadUrl,
                pathname: blob.pathname,
                contentType: blob.contentType,
                size: file.size,
                filename: file.name,
            });
        }

        // Case 2: Client upload token exchange (@vercel/blob/client)
        const body = await request.json();
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                return {
                    allowedContentTypes: [
                        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm',
                        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
                        'video/mp4', 'video/webm', 'video/quicktime',
                        'application/pdf', 'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'text/plain',
                    ],
                    maximumSizeInBytes: 25 * 1024 * 1024, // Reduced to 25MB for admin-only uploads
                    tokenPayload: JSON.stringify({
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: admin.username || admin.email || 'admin',
                    }),
                };
            },
            onUploadCompleted: async ({ blob }) => {
                console.log(`[upload] Admin ${admin.username || admin.email} uploaded:`, blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Error handling upload to Vercel Blob:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload media to Vercel Blob' },
            { status: 500 }
        );
    }
}
