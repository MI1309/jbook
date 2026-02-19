'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPracticeProgress } from '@/lib/api';

export default function ResetProgressButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm('Apakah anda yakin ingin menghapus semua riwayat latihan? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        setIsLoading(true);
        try {
            await resetPracticeProgress();
            alert('Progress berhasil direset.');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Gagal mereset progress.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span>🗑️</span>
            {isLoading ? 'Memproses...' : 'Reset Statistik'}
        </button>
    );
}
