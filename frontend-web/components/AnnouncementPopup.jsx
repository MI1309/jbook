'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function AnnouncementPopup() {
    const { theme } = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/content/announcements`);
                if (!res.ok) return;
                const data = await res.json();
                
                // Filter out already dismissed announcements
                const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
                const active = data.filter(a => !dismissed.includes(a.id));
                
                if (active.length > 0) {
                    setAnnouncements(active);
                    setIsVisible(true);
                }
            } catch (err) {
                console.error('Failed to fetch announcements:', err);
            }
        };

        fetchAnnouncements();
    }, []);

    const handleDismiss = () => {
        const current = announcements[currentIndex];
        const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
        localStorage.setItem('dismissed_announcements', JSON.stringify([...dismissed, current.id]));
        
        if (currentIndex < announcements.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsVisible(false);
        }
    };

    if (!isVisible || announcements.length === 0) return null;

    const current = announcements[currentIndex];

    // Styling based on type
    const getTypeStyles = (type) => {
        switch (type) {
            case 'important': return { bg: 'bg-red-600', text: 'text-white', icon: '🚨' };
            case 'warning': return { bg: 'bg-yellow-500', text: 'text-white', icon: '⚠️' };
            case 'success': return { bg: 'bg-green-600', text: 'text-white', icon: '✅' };
            default: return { bg: 'bg-blue-600', text: 'text-white', icon: 'ℹ️' };
        }
    };

    const styles = getTypeStyles(current.type);

    if (current.show_as_popup) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                <div className={`relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 border-b-8 ${styles.bg.replace('bg-', 'border-')}`}>
                    <div className={`${styles.bg} p-8 text-center`}>
                        <div className="text-5xl mb-4">{styles.icon}</div>
                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                            {current.title}
                        </h2>
                    </div>
                    <div className="p-8 md:p-10">
                        <div className={`text-base md:text-lg font-bold leading-relaxed mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {current.content}
                        </div>
                        <button 
                            onClick={handleDismiss}
                            className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${styles.bg} ${styles.text} hover:opacity-90`}
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Banner style (top of the page)
    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-2xl transform animate-in slide-in-from-top-full duration-500`}>
            <div className={`${styles.bg} ${styles.text} p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/20`}>
                <div className="flex items-center gap-3">
                    <span className="text-xl">{styles.icon}</span>
                    <div>
                        <p className="text-xs font-black uppercase opacity-80 tracking-widest">{current.title}</p>
                        <p className="text-sm font-bold">{current.content}</p>
                    </div>
                </div>
                <button 
                    onClick={handleDismiss}
                    className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
