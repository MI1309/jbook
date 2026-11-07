import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import { AdminEmptyState, AdminSkeleton } from '@/components/admin/AdminFeedback';

const levelTone = {
    5: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
    4: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
    3: 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]',
    2: 'bg-[var(--brand-red)]/10 text-[var(--brand-red)]',
};

export default function BunpoListTable({
    columns,
    rows,
    loading,
    hasActiveFilter,
    page,
    pages,
    onPageChange,
    onDelete,
}) {
    const emptyTitle = hasActiveFilter ? 'Tidak ada hasil' : 'Belum ada pola Bunpo';
    const emptyMessage = hasActiveFilter
        ? 'Coba ubah atau reset filter pencarian.'
        : 'Tambahkan pola pertama untuk mulai mengelola materi.';

    if (loading) return <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminSkeleton rows={5} /></div>;
    if (!rows.length) return <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminEmptyState title={emptyTitle} message={emptyMessage} href={hasActiveFilter ? undefined : '/admin/bunpo/new'} actionLabel={hasActiveFilter ? undefined : 'Tambah pola pertama'} /></div>;

    return <>
        <div className="hidden sm:block">
            <AdminDataTable
                columns={columns}
                rows={rows}
                getRowId={(item) => item.id}
                onView={(item) => `/admin/bunpo/${item.id}`}
                onEdit={(item) => `/admin/bunpo/${item.id}/edit`}
                onDelete={onDelete}
                page={page}
                pages={pages}
                onPageChange={onPageChange}
            />
        </div>
        <div className="space-y-3 sm:hidden">
            {rows.map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="break-words text-base font-semibold text-[var(--foreground)]">{item.title}</h2>
                            <p className="mt-1 break-words text-sm text-[var(--foreground)]/65">{item.structure || 'Struktur belum diisi'}</p>
                        </div>
                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${levelTone[item.jlpt_level] || 'bg-[var(--background)] text-[var(--foreground)]/65'}`}>N{item.jlpt_level}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-3">
                        <span className="text-xs text-[var(--foreground)]/60">Bab {item.chapter ?? '—'}</span>
                        <div className="flex items-center gap-1">
                            <Link href={`/admin/bunpo/${item.id}`} aria-label={`Lihat ${item.title}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--foreground)]/70 hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"><Eye size={18} /></Link>
                            <Link href={`/admin/bunpo/${item.id}/edit`} aria-label={`Edit ${item.title}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"><Pencil size={18} /></Link>
                            <button type="button" onClick={() => onDelete(item)} aria-label={`Hapus ${item.title}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Trash2 size={18} /></button>
                        </div>
                    </div>
                </article>
            ))}
            {pages > 1 && <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-sm">
                <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="min-h-11 rounded-lg border border-[var(--border-color)] px-3 disabled:opacity-40">Sebelumnya</button>
                <span aria-live="polite">{page} / {pages}</span>
                <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="min-h-11 rounded-lg border border-[var(--border-color)] px-3 disabled:opacity-40">Berikutnya</button>
            </div>}
        </div>
    </>;
}