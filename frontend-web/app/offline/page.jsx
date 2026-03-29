'use client';

import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
                <div className="text-6xl animate-bounce">📵</div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Kamu Sedang Offline</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Halaman ini belum tersedia secara offline. Hubungkan internet atau gunakan fitur 
                        <span className="font-bold text-red-600"> Mode Offline </span> 
                        untuk mengunduh materi belajar.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link 
                        href="/" 
                        className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95"
                    >
                        Ke Beranda
                    </Link>
                    <button 
                        onClick={() => window.location.reload()}
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>

                <p className="text-[10px] text-gray-400">
                    Catatan: Fitur Blog dan beberapa fitur lainnya memerlukan koneksi internet aktif.
                </p>
            </div>
        </div>
    );
}
