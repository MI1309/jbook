import { upload } from '@vercel/blob/client';

/**
 * Upload a file to Vercel Blob storage (Permanent public access)
 * @param {File} file - The browser File object
 * @param {Object} options - Optional parameters
 * @param {string} options.folder - Destination folder ('audio', 'images', 'choukai', etc.)
 * @param {Function} options.onProgress - Callback with percentage progress (0 to 100)
 * @returns {Promise<{ url: string, filename: string, size: number }>}
 */
export async function uploadToBlob(file, { folder = 'media', onProgress } = {}) {
    if (!file) {
        throw new Error('No file provided for upload');
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `${folder}/${Date.now()}-${cleanFileName}`;

    try {
        // Attempt 1: Direct client-to-blob upload using @vercel/blob/client
        const newBlob = await upload(pathname, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    onProgress(pct);
                }
            },
        });

        return {
            url: newBlob.url,
            downloadUrl: newBlob.downloadUrl || newBlob.url,
            pathname: newBlob.pathname,
            filename: file.name,
            size: file.size,
            contentType: newBlob.contentType || file.type,
        };
    } catch (clientErr) {
        console.warn('Client upload failed, trying multipart server upload fallback:', clientErr);

        // Fallback: Direct Multipart FormData to /api/upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        if (onProgress) onProgress(100);
        return data;
    }
}
