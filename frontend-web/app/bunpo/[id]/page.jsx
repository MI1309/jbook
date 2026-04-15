
import { getGrammarDetail } from '@/lib/api';
import Link from 'next/link';

import BunpoDetailUI from '@/components/BunpoDetailUI';

export default async function BunpoDetailPage({ params }) {
    const { id } = await params;
    const grammar = await getGrammarDetail(id);

    if (!grammar) {
        return (
            <div className="container mx-auto px-4 py-16 text-center uppercase tracking-widest font-black">
                <div className="text-6xl mb-6">📜</div>
                <h1 className="text-2xl text-gray-800 mb-4">Tata Bahasa Tidak Ditemukan</h1>
                <Link href="/bunpo" className="text-blue-500 hover:underline">Kembali ke Daftar</Link>
            </div>
        );
    }

    return <BunpoDetailUI grammar={grammar} />;
}
