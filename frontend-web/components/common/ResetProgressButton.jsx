'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPracticeProgress } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ResetProgressButton() {
    const router = useRouter();
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const performReset = async () => {
        setIsLoading(true);
        try {
            await resetPracticeProgress();
            toast.success('Progress berhasil direset.', { theme: theme === 'dark' ? 'dark' : 'colored' });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Gagal mereset progress.', { theme: theme === 'dark' ? 'dark' : 'colored' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>🗑️</span>
                {isLoading ? 'Memproses...' : 'Reset Statistik'}
            </button>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={performReset}
                title="Reset Progress?"
                message="Apakah anda yakin ingin menghapus semua riwayat latihan? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Reset"
                cancelText="Batal"
                type="danger"
            />
        </>
    );
}
