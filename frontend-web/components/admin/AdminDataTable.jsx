import Link from 'next/link';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { AdminEmptyState, AdminSkeleton } from '@/components/admin/AdminFeedback';

export default function AdminDataTable({ columns, rows, getRowId, loading, emptyTitle = 'Belum ada data', emptyMessage, onView, onEdit, onDelete, page, pages, onPageChange }) {
    if (loading) return <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminSkeleton rows={5} /></div>;
    if (!rows.length) return <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminEmptyState title={emptyTitle} message={emptyMessage} /></div>;

    return <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
                <thead><tr>{columns.map(column => <th key={column.key} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground)]/60">{column.label}</th>)}{(onView || onEdit || onDelete) && <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-[var(--foreground)]/60">Aksi</th>}</tr></thead>
                <tbody className="divide-y divide-[var(--border-color)]">{rows.map(row => <tr key={getRowId(row)} className="hover:bg-[var(--background)]">{columns.map(column => <td key={column.key} className="max-w-xs px-4 py-3 text-sm text-[var(--foreground)]">{column.render ? column.render(row) : row[column.key]}</td>)}{(onView || onEdit || onDelete) && <td className="px-4 py-3"><div className="flex justify-end gap-1">{onView && <Link href={onView(row)} aria-label={`Lihat ${row.label || getRowId(row)}`} className="rounded-lg p-2 text-[var(--foreground)]/65 hover:bg-[var(--background)]"><Eye size={16} /></Link>}{onEdit && <Link href={onEdit(row)} aria-label={`Edit ${row.label || getRowId(row)}`} className="rounded-lg p-2 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10"><Pencil size={16} /></Link>}{onDelete && <button type="button" onClick={() => onDelete(row)} aria-label={`Hapus ${row.label || getRowId(row)}`} className="rounded-lg p-2 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10"><Trash2 size={16} /></button>}</div></td>}</tr>)}</tbody>
            </table>
        </div>
        {pages > 1 && <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-3 text-sm"><span>Halaman {page} dari {pages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 disabled:opacity-40">Sebelumnya</button><button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 disabled:opacity-40">Berikutnya</button></div></div>}
    </div>;
}