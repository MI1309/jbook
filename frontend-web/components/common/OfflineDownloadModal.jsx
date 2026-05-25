'use client';

import { useState, useEffect, useCallback } from 'react';
import { downloadAllForOffline, dbGetStats, dbClearAll, isOfflineDataStale, checkOfflineUpdates } from '@/lib/offline-download';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function OfflineDownloadModal({ isOpen, onClose }) {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState({ step: 0, total: 3, label: '', percent: 0 });
    const [stats, setStats] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isStale, setIsStale] = useState(false);
    const [hasNewData, setHasNewData] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            const s = await dbGetStats();
            setStats(s);
            const stale = await isOfflineDataStale();
            setIsStale(stale);
            
            if (s && s.downloadedAt) {
                const { hasUpdate } = await checkOfflineUpdates();
                setHasNewData(hasUpdate);
            } else {
                setHasNewData(false);
            }
        } catch {
            setStats(null);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setStatus('checking');
            loadStats().finally(() => setStatus('idle'));
        }
    }, [isOpen, loadStats]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleDownload = async () => {
        setStatus('downloading');
        setErrorMsg('');
        try {
            const result = await downloadAllForOffline((p) => setProgress(p));
            setStats(result);
            setStatus('done');
        } catch (err) {
            setErrorMsg(err.message || 'Gagal mengunduh data.');
            setStatus('error');
        } finally {
            // Re-check after download to clear warning
            loadStats();
        }
    };

    const performClear = async () => {
        await dbClearAll();
        setStats(null);
        setHasNewData(false);
        setStatus('idle');
    };

    const formatDate = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    const hasData = stats && (stats.vocab > 0 || stats.kanji > 0 || stats.grammar > 0);
    const isDownloading = status === 'downloading';

    return (
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={!isDownloading ? onClose : undefined}
                />

                {/* Modal — centered on all screens */}
                <div
                    className="relative w-full max-w-sm bg-[#131317] border border-[#212127] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{ maxHeight: '90dvh' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-accent-blue/15 to-accent-green/15 border-b border-[#212127] px-5 py-4 text-foreground flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📲</span>
                                <div>
                                    <h2 className="font-japanese font-black text-base leading-tight">Mode Offline</h2>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        Unduh semua data ke perangkat
                                    </p>
                                </div>
                            </div>
                            {!isDownloading && (
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
                                    aria-label="Tutup"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content — scrollable */}
                    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                        {/* Checking */}
                        {status === 'checking' && (
                            <div className="flex items-center justify-center gap-3 text-gray-500 text-sm py-8">
                                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                Memeriksa data lokal...
                            </div>
                        )}

                        {/* Idle / Done */}
                        {(status === 'idle' || status === 'done') && (
                            <>
                                {/* Status card */}
                                {hasData ? (
                                    <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3.5 h-3.5 text-[#0b0b0d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="font-bold text-accent-green text-sm">Data tersimpan di perangkat</span>
                                        </div>

                                        {/* Stats grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                            {[
                                                { label: 'Kotoba', count: stats.vocab },
                                                { label: 'Kanji', count: stats.kanji },
                                                { label: 'Bunpo', count: stats.grammar },
                                            ].map(({ label, count }) => (
                                                <div key={label} className="bg-white/5 rounded-lg p-2 border border-[#212127]">
                                                    <div className="text-lg font-japanese font-black text-accent-green leading-tight">
                                                        {count.toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">{label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {stats.downloadedAt && (
                                            <p className="text-[10px] text-gray-500 text-center">
                                                Diunduh: {formatDate(stats.downloadedAt)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-[#212127] rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-white/5 border border-[#212127] rounded-full flex items-center justify-center text-xl flex-shrink-0">📱</div>
                                            <div>
                                                <div className="font-bold text-foreground text-sm">Belum ada data offline</div>
                                                <div className="text-xs text-gray-400">Unduh agar bisa belajar tanpa internet</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                            {[
                                                { icon: '📚', text: '~8.500+ Kosakata' },
                                                { icon: '漢', text: 'Kanji N1–N5' },
                                                { icon: '📖', text: 'Pola Tata Bahasa' },
                                                { icon: '🧪', text: 'Soal Latihan' },
                                            ].map(({ icon, text }) => (
                                                <div key={text} className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="flex-shrink-0">{icon}</span>
                                                    <span>{text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stale warning */}
                                {isStale && (
                                    <div className="flex items-start gap-2 bg-accent-gold/5 border border-accent-gold/20 rounded-lg px-3 py-2 text-xs text-accent-gold">
                                        <span className="flex-shrink-0">⚠️</span>
                                        <span>Data sudah lebih dari 2 bulan. Disarankan untuk <b>perbarui</b> agar tetap akurat.</span>
                                    </div>
                                )}
                                
                                {/* New data warning */}
                                {hasNewData && (
                                    <div className="flex items-start gap-2 bg-accent-blue/5 border border-accent-blue/20 rounded-lg px-3 py-2 text-xs text-accent-blue">
                                        <span className="flex-shrink-0">🆕</span>
                                        <span>Ada data Kotoba, Kanji, atau Bunpo terbaru! Silakan <b>perbarui</b> data offline kamu.</span>
                                    </div>
                                )}

                                {/* Download button */}
                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    {hasData ? '🔄 Perbarui Data Offline' : '⬇️ Unduh untuk Offline'}
                                </button>

                                {hasData && (
                                    <button
                                        onClick={() => setShowClearConfirm(true)}
                                        className="w-full text-gray-500 hover:text-rose-500 text-sm py-1.5 transition-colors"
                                    >
                                        Hapus data offline
                                    </button>
                                )}
                            </>
                        )}

                        {/* Downloading */}
                        {status === 'downloading' && (
                            <div className="py-4 space-y-5">
                                {/* Animated icon */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full bg-accent-blue/10 animate-ping opacity-40" />
                                        <div className="absolute inset-0 flex items-center justify-center text-3xl">⬇️</div>
                                    </div>
                                    <div className="font-bold text-foreground text-base">Mengunduh data...</div>
                                    <div className="text-sm text-gray-400">
                                        {progress.step}/{progress.total} — {progress.label}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-accent-blue to-accent-green rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                            style={{ width: `${Math.max(progress.percent, 4)}%` }}
                                        >
                                            {progress.percent > 15 && (
                                                <span className="text-white text-[10px] font-bold">{progress.percent}%</span>
                                            )}
                                        </div>
                                    </div>
                                    {progress.percent <= 15 && (
                                        <div className="text-center text-xs text-gray-500 mt-1">{progress.percent}%</div>
                                    )}
                                </div>

                                <p className="text-center text-xs text-accent-gold bg-accent-gold/5 border border-accent-gold/20 rounded-lg py-2 px-3">
                                    ⚠️ Jangan tutup halaman ini saat mengunduh
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {status === 'error' && (
                            <div className="space-y-3">
                                <div className="bg-rose-950/10 border border-rose-950/20 rounded-xl p-4 text-sm text-rose-400">
                                    <div className="font-bold mb-1">⚠️ Gagal mengunduh</div>
                                    <p className="text-rose-400 text-xs">{errorMsg}</p>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-accent-blue text-white font-bold py-3.5 rounded-xl transition-all hover:bg-accent-blue/90"
                                >
                                    Coba lagi
                                </button>
                                <button onClick={onClose} className="w-full text-gray-500 text-sm py-1.5">
                                    Batal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={performClear}
                title="Hapus Data Offline?"
                message="Semua data yang telah diunduh akan dihapus dari perangkat ini. Kamu perlu mengunduh ulang untuk belajar secara offline."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />
        </>
    );
}
