'use client';

import Link from 'next/link';
import BunpoImportPanel from '@/app/admin/bunpo/BunpoImportPanel';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function BunpoImportPage() {
    return <div className="space-y-5"><AdminPageHeader title="Import Bunpo" breadcrumbs={[{ label: 'Bunpo', href: '/admin/bunpo' }, { label: 'Import' }]} action={<Link href="/admin/bunpo" className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm">Kembali ke Bunpo</Link>} /><BunpoImportPanel onImported={() => {}} /></div>;
}
