import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { AdminErrorState } from '@/components/admin/AdminFeedback';

export default function AdminFormShell({ title, description, breadcrumbs = [], backHref, onSubmit, saving, error, children, submitLabel = 'Simpan perubahan' }) {
    return <div className="mx-auto max-w-4xl space-y-6">
        <AdminPageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
        {error && <AdminErrorState title="Formulir belum tersimpan" message={error} />}
        <form onSubmit={onSubmit} className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="space-y-5 p-5 sm:p-7">{children}</div>
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-color)] p-5 sm:flex-row sm:justify-end sm:px-7">
                <Link href={backHref} className="rounded-lg border border-[var(--border-color)] px-5 py-2.5 text-center text-sm font-medium hover:bg-[var(--background)]">Batal</Link>
                <button type="submit" disabled={saving} className="rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{saving ? 'Menyimpan...' : submitLabel}</button>
            </div>
        </form>
    </div>;
}