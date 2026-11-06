'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import SakuraBackground from '@/components/common/SakuraBackground';

export default function ClientShell({ children }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);

    useEffect(() => {
        const cleanupLegacyOfflineData = async () => {
            const cleanupKey = 'jbook_offline_cleanup_v1';
            if (localStorage.getItem(cleanupKey)) return;

            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations
                        .filter(registration => registration.active?.scriptURL.endsWith('/sw.js'))
                        .map(registration => registration.unregister()));
                }

                if ('caches' in window) {
                    const legacyCacheNames = ['app-core-pages', 'pages', 'apis', 'backend-api', 'blog-online-only'];
                    const keys = await caches.keys();
                    await Promise.all(keys
                        .filter(key => legacyCacheNames.includes(key) || key.startsWith('workbox-'))
                        .map(key => caches.delete(key)));
                }

                if ('indexedDB' in window) indexedDB.deleteDatabase('jbook-offline');

                for (const key of Object.keys(localStorage)) {
                    if (key.startsWith('jbook_cache:') ||
                        ['jbook_vocab_visibility', 'jbook_kanji_visibility', 'jbook_bunpo_visibility', 'offline_practice_queue'].includes(key)) {
                        localStorage.removeItem(key);
                    }
                }
                localStorage.setItem(cleanupKey, 'done');
            } catch (error) {
                console.warn('Failed to remove legacy offline data:', error);
            }
        };

        cleanupLegacyOfflineData();
    }, []);

    return (
        <>
            {!isAuthRoute && <SakuraBackground />}
            {!isAdminRoute && !isAuthRoute && <Navbar />}
            <main className={pathname === '/' || isAuthRoute ? '' : 'flex-grow'}>
                {children}
            </main>
            {!isAdminRoute && !isAuthRoute && <Footer />}
        </>
    );
}