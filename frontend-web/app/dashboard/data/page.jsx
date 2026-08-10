'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { exportPracticeData, importPracticeData } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import { toast } from 'react-toastify';

export default function DataManagementPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [actionError, setActionError] = useState(null);

    const handleExport = async () => {
        setIsExporting(true);
        setActionError(null);
        try {
            let exportData;
            if (user) {
                exportData = await exportPracticeData();
            } else {
                exportData = getGuestAnalytics();
                exportData._exported_at = new Date().toISOString();
                exportData._source = 'guest';
            }
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `jbook_practice_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Data berhasil diekspor!', { theme: theme === 'dark' ? 'dark' : 'colored' });
        } catch (err) {
            setActionError(`Ekspor gagal: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setActionError(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (user) {
                    const result = await importPracticeData(data);
                    if (result.skipped > 0 && result.imported === 0) {
                        toast.info(`Semua data sudah ada (${result.skipped} data dilewati).`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    } else if (result.skipped > 0) {
                        toast.success(`Berhasil mengimpor ${result.imported} data baru.`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    } else {
                        toast.success(`Data berhasil diimpor!`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    }
                } else {
                    if (typeof data.total_attempts === 'undefined') {
                        throw new Error('Format file tidak valid untuk data guest.');
                    }
                    if (!data.kakitori_stats) {
                        data.kakitori_stats = {
                            total_attempts: 0,
                            total_questions: 0,
                            correct: 0,
                            accuracy: 0,
                            level_breakdown: []
                        };
                    }
                    delete data._exported_at;
                    delete data._source;
                    localStorage.setItem('guest_practice_analytics', JSON.stringify(data));
                    toast.success('Data berhasil diimpor ke mode guest!', { theme: theme === 'dark' ? 'dark' : 'colored' });
                }
            } catch (err) {
                console.error("Import error:", err);
                const msg = err instanceof SyntaxError
                    ? "Format file tidak valid. Pastikan file adalah JSON."
                    : err.message;
                setActionError(`Impor gagal: ${msg}`);
            } finally {
                setIsImporting(false);
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');
    const cardHeaderBase = tc('bg-black/40 border-blue-900/20', 'bg-gray-50 border-gray-100');

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <h2 className={`text-xl font-black transition-colors ${textPrimary}`}>Manajemen Data</h2>
                {!user && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-auto ${tc('bg-blue-900/40 text-blue-400', 'bg-blue-100 text-blue-700')}`}>
                        Mode Tamu
                    </span>
                )}
            </div>

            {actionError && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3" role="alert">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <div className="font-bold">Terjadi Kendala</div>
                        <div className="text-sm">{actionError}</div>
                    </div>
                    <button onClick={() => setActionError(null)} className="ml-auto text-blue-500 hover:text-blue-700">&times;</button>
                </div>
            )}

            <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${cardBase}`}>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-black transition-all hover:border-blue-500/50 disabled:opacity-50 ${tc('bg-black/20 border-white/10 text-gray-300 hover:text-white', 'bg-white border-gray-200 text-gray-700 hover:text-gray-900')}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {isExporting ? 'Mengekspor...' : 'Export Data (.json)'}
                        </button>
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-black transition-all hover:border-blue-500/50 cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''} ${tc('bg-black/20 border-white/10 text-gray-300 hover:text-white', 'bg-white border-gray-200 text-gray-700 hover:text-gray-900')}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {isImporting ? 'Mengimpor...' : 'Import Data (.json)'}
                            <input type="file" accept=".json" className="sr-only" onChange={handleImport} disabled={isImporting} />
                        </label>
                    </div>
                    <p className={`mt-4 text-xs text-center transition-colors ${textMuted}`}>
                        Cadangkan atau pindahkan riwayat latihan kamu ke perangkat lain. Data kakitori (latihan dikte) ikut tersimpan dalam file yang sama secara otomatis.
                    </p>
                </div>
            </div>
        </div>
    );
}
