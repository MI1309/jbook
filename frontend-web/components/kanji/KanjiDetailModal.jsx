'use client';

import { useState, useEffect } from 'react';
import { getKanjiDetail } from '@/lib/api';
import KanjiDetailUI from './KanjiDetailUI';
import { useRouter } from 'next/navigation';

export default function KanjiDetailModal({ id, onClose }) {
    const [kanji, setKanji] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getKanjiDetail(id).then(data => {
            if (mounted) {
                setKanji(data);
                setLoading(false);
            }
        }).catch(err => {
            if (mounted) {
                console.error("Failed to fetch kanji offline", err);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, [id]);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back(); // or clear query param
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center animate-pulse">
                <div className="text-6xl mb-4">🏮</div>
                <p className="text-gray-400 dark:text-gray-600 font-black tracking-widest uppercase text-sm">Sedang memuat Detail Offline...</p>
            </div>
        );
    }

    if (!kanji) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto">
                <div className="p-6">
                    <button onClick={handleClose} className="mb-4 text-blue-600 dark:text-blue-400 font-bold transition-colors">← Kembali</button>
                    <div className="text-center py-32 bg-gray-50 dark:bg-card rounded-[3rem] transition-colors border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Data Offline Tidak Ditemukan</h2>
                        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Mungkin data ini belum kamu unduh secara utuh.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto">
            <KanjiDetailUI kanji={kanji} onClose={handleClose} />
        </div>
    );
}
