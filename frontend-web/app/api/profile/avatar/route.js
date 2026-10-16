import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://japan.pythonanywhere.com/api').replace(/\/$/, '');
const MAX_AVATAR_SIZE = 1024 * 1024;
const IMAGE_TYPES = {
    'image/webp': { extension: 'webp', signature: (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' },
};

async function getAuthenticatedUser(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    return response.ok ? response.json() : null;
}

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Silakan login untuk mengunggah foto profil.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || typeof file === 'string' || file.size === 0) {
            return NextResponse.json({ error: 'Pilih file gambar terlebih dahulu.' }, { status: 400 });
        }
        if (file.size > MAX_AVATAR_SIZE) {
            return NextResponse.json({ error: 'Ukuran foto setelah kompresi maksimal 1 MB.' }, { status: 413 });
        }

        const imageType = IMAGE_TYPES[file.type];
        if (!imageType) {
            return NextResponse.json({ error: 'Upload foto profil hanya menerima format WebP terkompresi.' }, { status: 415 });
        }

        const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
        if (!imageType.signature(header)) {
            return NextResponse.json({ error: 'Isi file tidak sesuai dengan format gambar.' }, { status: 415 });
        }

        const blob = await put(`avatars/${user.id}-${crypto.randomUUID()}.${imageType.extension}`, file, {
            access: 'public',
            addRandomSuffix: false,
            contentType: file.type,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error('[profile-avatar] Upload failed:', error);
        return NextResponse.json({ error: 'Gagal mengunggah foto profil.' }, { status: 500 });
    }
}