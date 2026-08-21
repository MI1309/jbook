import { Suspense } from 'react';
import { getVocabDetail } from '@/lib/api';
import Link from 'next/link';
import { hasKanji } from '@/lib/utils';
import KotobaDetailUI from '@/components/kotoba/KotobaDetailUI';

export default async function KotobaDetailPage({ params }) {
    const { id } = await params;
    const vocab = await getVocabDetail(id);
    if (!vocab) {
        return (
            <div className="container mx-auto px-4 py-32 text-center min-h-screen flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">🏮</div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">Kosakata Tidak Ditemukan</h1>
                <Link href="/kotoba" className="text-red-600 font-bold hover:underline">Kembali ke Daftar</Link>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 font-bold">🏮 Memuat...</div>}>
            <KotobaDetailUI vocab={vocab} />
        </Suspense>
    );
}
