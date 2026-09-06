'use client';

import { useState } from 'react';

export default function ShareButtons({ title, url }) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : url || '';

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: title || 'JBook Blog',
                    text: `Baca artikel "${title}" di JBook!`,
                    url: shareUrl,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    handleCopy();
                }
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = async () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            } catch (err) {
                console.error('Copy failed', err);
            }
        }
    };

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title || 'JBook Blog')}&url=${encodeURIComponent(shareUrl)}&hashtags=JBook,BelajarBahasaJepang`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`;

    return (
        <div className="flex flex-wrap items-center gap-2.5">
            <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all active:scale-95 font-bold text-sm"
                aria-label="Bagikan artikel"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Bagikan</span>
            </button>

            <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 font-bold text-sm ${
                    copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                aria-label="Salin link artikel"
            >
                {copied ? (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Tersalin!</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>Salin Link</span>
                    </>
                )}
            </button>

            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all active:scale-95 font-bold text-sm"
                aria-label="Share ke WhatsApp"
            >
                <span>WhatsApp</span>
            </a>

            <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl transition-all active:scale-95 font-bold text-sm"
                aria-label="Share ke X / Twitter"
            >
                <span>X / Twitter</span>
            </a>
        </div>
    );
}
