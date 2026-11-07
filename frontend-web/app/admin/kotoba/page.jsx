import { Suspense } from 'react';
import KotobaAdminClient from '@/components/admin/KotobaAdminClient';

export default function KotobaAdminPage() {
    return (
        <Suspense fallback={<div className="mx-auto w-full max-w-7xl animate-pulse space-y-4 px-4 py-8 sm:px-6 lg:px-8"><div className="h-10 w-64 rounded-lg bg-[var(--border-color)]" /><div className="h-14 rounded-lg bg-[var(--border-color)]" /><div className="h-80 rounded-xl bg-[var(--border-color)]" /></div>}>
            <KotobaAdminClient />
        </Suspense>
    );
}