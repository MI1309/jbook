'use client';

import { useState, useRef } from 'react';
import { uploadToBlob } from '@/lib/blob-upload';

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
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50 hover:bg-neutral-900'
                    }`}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <div className="w-10 h-10 mx-auto border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-indigo-400">
                                Mengunggah ke Vercel Blob... {progress > 0 && `(${progress}%)`}
                            </p>
                            {progress > 0 && (
                                <div className="w-48 mx-auto bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 text-2xl">
                                🎵
                            </div>
                            <div>
                                <p className="text-sm font-bold text-neutral-200">
                                    Klik untuk upload audio, atau seret file ke sini
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">
                                    {helperText}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Preview Audio & Action */
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xl">🎧</span>
                            <span className="text-xs font-mono text-neutral-300 truncate max-w-[280px] sm:max-w-md">
                                {value}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                            >
                                Ganti File
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                disabled={uploading}
                                className="px-3 py-1.5 text-xs font-medium bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
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
                <p className="text-xs font-medium text-red-400 mt-1">
                    ⚠️ {error}
                </p>
            )}

            {/* Manual URL Input (Collapsible) */}
            {showManualInput && (
                <div className="mt-2 pt-2 border-t border-neutral-800">
                    <input
                        type="url"
                        placeholder="https://... (URL Audio Langsung)"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full p-2.5 border border-neutral-700 rounded-lg bg-neutral-900 text-sm font-mono text-neutral-200"
                    />
                </div>
            )}
        </div>
    );
}
