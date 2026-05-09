'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

export default function AnnouncementPopup() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch(`${API_URL}/content/announcements`);
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                
                // Determine storage key
                let storageKey = 'dismissed_announcements_guest';
                if (user?.id) {
                    storageKey = `dismissed_announcements_user_${user.id}`;
                } else {
                    // Handle guest session
                    let sessionId = sessionStorage.getItem('jbook_guest_session');
                    if (!sessionId) {
                        sessionId = Math.random().toString(36).substring(2, 15);
                        sessionStorage.setItem('jbook_guest_session', sessionId);
                    }
                    storageKey = `dismissed_announcements_guest_${sessionId}`;
                }

                // Filter out already dismissed announcements
                const dismissed = JSON.parse(localStorage.getItem(storageKey) || '[]');
                let active = data.filter(a => !dismissed.includes(a.id));
                
                if (active.length > 0) {
                    // Constraint: Max 1 popup per session
                    // We check if we already showed a popup this session
                    const popupShowed = sessionStorage.getItem('popup_showed_this_session');
                    
                    if (popupShowed) {
                        // If already showed a popup, force all to be banners
                        active = active.map(a => ({ ...a, show_as_popup: false }));
                    } else {
                        // Find the first one that wants to be a popup
                        let firstPopupIdx = active.findIndex(a => a.show_as_popup);
                        if (firstPopupIdx !== -1) {
                            // Keep it as popup, but force others to be banners
                            active = active.map((a, idx) => ({
                                ...a,
                                show_as_popup: idx === firstPopupIdx
                            }));
                        }
                    }

                    setAnnouncements(active);
                    setIsVisible(true);
                }
            } catch (err) {
                // Silently fail to not block rendering
                console.warn('Announcement fetch failed:', err);
            }
        };

        fetchAnnouncements();
    }, [user?.id]);

    const handleDismiss = () => {
        const current = announcements[currentIndex];
        
        // Determine storage key
        let storageKey = 'dismissed_announcements_guest';
        if (user?.id) {
            storageKey = `dismissed_announcements_user_${user.id}`;
        } else {
            const sessionId = sessionStorage.getItem('jbook_guest_session');
            storageKey = `dismissed_announcements_guest_${sessionId}`;
        }

        const dismissed = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify([...dismissed, current.id]));
        
        // If it was a popup, mark that we showed one this session
        if (current.show_as_popup) {
            sessionStorage.setItem('popup_showed_this_session', 'true');
        }

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

