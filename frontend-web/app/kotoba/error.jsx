'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function KotobaError({ reset }) {
    return (
        <main role="alert" className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
            <h1 className="text-xl font-bold">Kotoba tidak dapat dimuat</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Terjadi kendala saat membuka kosakata. Coba muat ulang halaman.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-blue px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"><RefreshCw size={16} /> Coba lagi</button>
                <Link href="/kotoba" className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">Kembali ke Kotoba</Link>
            </div>
        </main>
    );
}