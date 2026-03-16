'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ClientShell({ children, footer }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Navbar />}
            <main className="flex-grow">
                {children}
            </main>
            {!isAdminRoute && footer}
        </>
    );
}