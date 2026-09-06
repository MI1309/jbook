import { handleUpload } from '@vercel/blob/client';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // Case 1: Direct multipart form data upload
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            const folder = formData.get('folder') || 'media';

            if (!file || typeof file === 'string') {
                return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
            }

            const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const pathname = `${folder}/${Date.now()}-${cleanFileName}`;

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
                    maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
                    tokenPayload: JSON.stringify({
                        uploadedAt: new Date().toISOString(),
                    }),
                };
            },
            onUploadCompleted: async ({ blob }) => {
                console.log('Vercel Blob upload completed:', blob.url);
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
