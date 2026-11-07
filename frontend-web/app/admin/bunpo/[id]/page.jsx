'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import BunpoDetailUI from '@/components/bunpo/BunpoDetailUI';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';

export default function BunpoDetailPage() {
    const { id } = useParams();
        const { authenticatedFetch } = useAuth();
        const [item, setItem] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');

        useEffect(() => {
            let cancelled = false;
            const load = async () => {
                setLoading(true);
                setError('');
                try {
                    const response = await authenticatedFetch(`${API_URL}/admin/bunpo/${id}`);
                    if (!response.ok) throw new Error(response.status === 404 ? 'Pola Bunpo tidak ditemukan.' : `Gagal memuat Bunpo (${response.status}).`);
                    const data = await response.json();
                    if (!cancelled) setItem({ ...data, meaning: data.meaning || data.structure });
                } catch (loadError) {
                    if (!cancelled) setError(loadError.message || 'Tidak dapat terhubung ke server.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };
            load();
            return () => { cancelled = true; };
        }, [id, authenticatedFetch]);

        if (loading) return <AdminSkeleton rows={6} />;
        if (error) return <AdminErrorState title="Bunpo tidak tersedia" message={error} onRetry={() => window.location.reload()} />;
        if (!item) return null;

        return <div className="space-y-6">
            <AdminPageHeader
                title={item.title}
                breadcrumbs={[{ label: 'Bunpo', href: '/admin/bunpo' }, { label: 'Detail' }]}
                action={<div className="flex gap-2"><Link href="/admin/bunpo" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border-color)] px-4 text-sm">Kembali</Link><Link href={`/admin/bunpo/${id}/edit`} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-red)] px-4 text-sm font-medium text-white">Edit</Link></div>}
            />
            <section aria-label="Metadata Bunpo" className="grid gap-3 border-y border-[var(--border-color)] py-4 sm:grid-cols-2">
                <p className="text-sm text-[var(--foreground)]/70">Level <strong className="ml-1 text-[var(--foreground)]">N{item.jlpt_level}</strong></p>
                <p className="text-sm text-[var(--foreground)]/70">Slug <strong className="ml-1 break-all text-[var(--foreground)]">{item.slug || '—'}</strong></p>
            </section>
            <BunpoDetailUI grammar={item} backHref="/admin/bunpo" backLabel="Kembali ke daftar admin" />
        </div>;
}
