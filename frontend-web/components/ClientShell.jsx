'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientShell({ children }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Navbar />}
            <main className="flex-grow">
                {children}
            </main>
            {!isAdminRoute && <Footer />}
        </>
    );
}