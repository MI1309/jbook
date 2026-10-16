'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Camera, LoaderCircle, Trophy } from 'lucide-react';
import AppMessage from '@/components/common/AppMessage';

const MAX_SOURCE_SIZE = 15 * 1024 * 1024;
const MAX_AVATAR_SIZE = 1024 * 1024;

async function compressAvatar(file) {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
        image.close();
        throw new Error('Browser tidak dapat memproses gambar ini.');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error('Gagal mengompres gambar.'));
        }, 'image/webp', 0.8);
    });
    if (blob.type !== 'image/webp') throw new Error('Browser tidak mendukung kompresi WebP.');
    if (blob.size > MAX_AVATAR_SIZE) throw new Error('Hasil kompresi masih lebih dari 1 MB. Pilih gambar yang lebih kecil.');

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

export default function ProfilePage() {
    const { user, loading, updateProfile } = useAuth();
    const { theme, mounted } = useTheme();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const dark = mounted && theme === 'dark';

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        setMessage('');
        setError('');
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Pilih gambar JPG, PNG, atau WebP.');
            return;
        }
        if (file.size > MAX_SOURCE_SIZE) {
            setError('Ukuran gambar asli maksimal 15 MB.');
            return;
        }

        setUploading(true);
        try {
            const compressedFile = await compressAvatar(file);
            const formData = new FormData();
            formData.append('file', compressedFile);
            const response = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal mengunggah foto profil.');

            await updateProfile({ profile_image: result.url });
            setMessage('Foto profil berhasil diperbarui.');
        } catch (uploadError) {
            setError(uploadError.message || 'Gagal mengunggah foto profil.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-[45vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!user) {
        return (
            <div className={`mx-auto max-w-xl px-4 py-16 text-center ${dark ? 'text-white' : 'text-gray-900'}`}>
                Silakan <Link href="/login" className="font-bold text-blue-600 hover:underline">login</Link> untuk melihat profil.
            </div>
        );
    }

    return (
        <main className={`mx-auto max-w-3xl px-4 py-10 sm:py-14 ${dark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-black">Profil</h1>
            <p className={`mt-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Kelola foto profil akunmu.</p>

            <section className={`mt-8 flex flex-col items-center gap-6 border-y py-8 sm:flex-row sm:items-center ${dark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-blue-600/20 bg-blue-600/10">
                    {user.profile_image ? (
                        <Image src={user.profile_image} alt={`Foto profil ${user.username}`} fill sizes="112px" unoptimized className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-black text-blue-600">{user.username?.[0]?.toUpperCase()}</div>
                    )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold">{user.username}</h2>
                    <p className={`mt-1 break-all text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                    >
                        {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        {uploading ? 'Mengunggah...' : user.profile_image ? 'Ganti foto' : 'Unggah foto'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="sr-only" />
                    <p className={`mt-2 text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>JPG, PNG, atau WebP. Foto diperkecil hingga 512 px dan dikompres maksimal 1 MB.</p>
                </div>
            </section>

            <section className={`mt-6 flex items-center gap-4 border-b py-5 ${dark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Trophy className="h-5 w-5" />
                </div>
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Poin TTS</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{user.tts_points ?? 0}</p>
                </div>
            </section>

            {message && <AppMessage variant="success" className="mt-4">{message}</AppMessage>}
            {error && <AppMessage variant="warning" className="mt-4">{error}</AppMessage>}
        </main>
    );
}