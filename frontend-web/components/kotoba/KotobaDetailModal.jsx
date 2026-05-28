'use client';

import { useState, useEffect } from 'react';
import { getVocabDetail } from '@/lib/api';
import KotobaDetailUI from './KotobaDetailUI';
import { useRouter } from 'next/navigation';

export default function KotobaDetailModal({ id, onClose }) {
    const [vocab, setVocab] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getVocabDetail(id).then(data => {
            if (mounted) {
                setVocab(data);
                setLoading(false);
            }
        }).catch(err => {
            if (mounted) {
                console.error("Failed to fetch vocab offline", err);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, [id]);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back();
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

    if (!vocab) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto w-full h-full">
                <div className="p-8">
                    <button onClick={handleClose} className="text-blue-600 dark:text-blue-400 font-bold mb-8 transition-colors">← Kembali</button>
                    <div className="text-center py-32 bg-gray-50 dark:bg-card rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800 transition-colors">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Data Offline Tidak Ditemukan</h2>
                        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Mungkin data ini belum diunduh sempurna.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-black overflow-y-auto w-full h-full">
            <KotobaDetailUI vocab={vocab} onClose={handleClose} />
        </div>
    );
}
