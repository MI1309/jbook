'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';

export default function AdminResourceDetail({ resource, id, fields }) {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_URL}/admin/${resource.endpoint}/${id}`, {
                    headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
                });
                if (response.status === 404) throw new Error(`${resource.label} dengan ID ${id} tidak ditemukan.`);
                if (!response.ok) throw new Error(`Gagal memuat ${resource.label} (${response.status}).`);
                const data = await response.json();
                if (!cancelled) setItem(data);
            } catch (fetchError) {
                if (!cancelled) setError(fetchError.message || `Tidak dapat memuat ${resource.label}.`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [id, resource]);

    if (loading) return <AdminSkeleton rows={5} />;
    if (error) return <AdminErrorState title={`${resource.label} tidak tersedia`} message={error} />;
    if (!item) return <AdminEmptyState title={`${resource.label} tidak ditemukan`} message="Data mungkin sudah dihapus atau tautannya tidak valid." href={`/admin/${resource.route}`} actionLabel="Kembali ke daftar" />;

    const title = resource.title(item);
    return <div className="mx-auto max-w-4xl space-y-6">
        <AdminPageHeader title={title} breadcrumbs={[{ label: resource.label, href: `/admin/${resource.route}` }, { label: `Detail #${id}` }]} action={<div className="flex gap-2"><Link href={`/admin/${resource.route}`} className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm">Kembali</Link><Link href={`/admin/${resource.route}/${id}/edit`} className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Edit</Link></div>} />
        <dl className="grid gap-px overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--border-color)] sm:grid-cols-2">{fields.map(field => <div key={field.key} className="min-w-0 bg-[var(--card-bg)] p-4 sm:p-5"><dt className="text-xs font-medium text-[var(--foreground)]/55">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--foreground)]">{field.render ? field.render(item) : item[field.key] ?? '—'}</dd></div>)}</dl>
    </div>;
}
