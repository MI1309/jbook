'use client';

import { useState, useRef } from 'react';
import { uploadToBlob } from '@/lib/blob-upload';
import { Headphones, Upload } from 'lucide-react';

export default function AudioUploadWidget({
    value = '',
    onChange,
    label = 'File Audio Choukai / Listening',
    folder = 'audio',
    helperText = 'Format yang didukung: MP3, WAV, M4A, OGG, WebM (Maks. 50MB)'
}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [showManualInput, setShowManualInput] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        // Check if file is audio
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
            setError('File harus berformat audio (MP3, WAV, M4A, OGG, WebM)');
            return;
        }

        // Limit size: 50MB
        if (file.size > 50 * 1024 * 1024) {
            setError('Ukuran file maksimal adalah 50MB');
            return;
        }

        setError(null);
        setUploading(true);
        setProgress(0);

        try {
            const result = await uploadToBlob(file, {
                folder,
                onProgress: (pct) => setProgress(pct),
            });

            if (result && result.url) {
                onChange(result.url);
            }
        } catch (err) {
            console.error('Upload audio error:', err);
            setError(err.message || 'Gagal mengunggah audio ke Vercel Blob');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="rounded px-2 py-1 text-xs text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                >
                    {showManualInput ? 'Sembunyikan URL Manual' : 'Input URL Manual'}
                </button>
            </div>

            {/* Hidden native input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFile(e.target.files[0]);
                    }
                }}
            />

            {/* Audio Upload Dropzone & Status */}
            {!value ? (
                <button
                    type="button"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait ${
                        isDragging
                            ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10'
                            : 'border-[var(--border-color)] bg-[var(--background)] hover:border-[var(--accent-blue)] hover:bg-[var(--admin-hover)]'
                    }`}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <div className="mx-auto size-10 animate-spin rounded-full border-3 border-[var(--accent-blue)]/20 border-t-[var(--accent-blue)]"></div>
                            <p className="text-sm font-medium text-[var(--accent-blue)]">
                                Mengunggah ke Vercel Blob... {progress > 0 && `(${progress}%)`}
                            </p>
                            {progress > 0 && (
                                <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-[var(--border-color)]">
                                    <div
                                        className="h-full bg-[var(--accent-blue)] transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--accent-blue)]/20 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                                <Upload size={20} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--foreground)]">
                                    Klik untuk upload audio, atau seret file ke sini
                                </p>
                                <p className="mt-1 text-xs text-[var(--foreground)]/55">
                                    {helperText}
                                </p>
                            </div>
                        </div>
                    )}
                </button>
            ) : (
                /* Preview Audio & Action */
                <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Headphones size={18} className="shrink-0 text-[var(--accent-blue)]" aria-hidden="true" />
                            <span className="max-w-[280px] truncate font-mono text-xs text-[var(--foreground)]/70 sm:max-w-md">
                                {value}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                            >
                                Ganti File
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                disabled={uploading}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>

                    {/* Audio Player Preview */}
                    <audio
                        key={value}
                        controls
                        className="w-full h-10 rounded-lg"
                        preload="metadata"
                    >
                        <source src={value} />
                        Browser Anda tidak mendukung elemen audio.
                    </audio>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p role="alert" className="mt-1 text-xs font-medium text-[var(--brand-red)]">
                    ⚠️ {error}
                </p>
            )}

            {/* Manual URL Input (Collapsible) */}
            {showManualInput && (
                <div className="mt-2 border-t border-[var(--border-color)] pt-3">
                    <input
                        type="url"
                        placeholder="https://... (URL Audio Langsung)"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-2.5 font-mono text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                    />
                </div>
            )}
        </div>
    );
}
