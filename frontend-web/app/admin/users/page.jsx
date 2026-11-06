import Link from 'next/link';
import { ArrowUpRight, Users } from 'lucide-react';

export default function AdminUsersPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <p className="text-sm text-[var(--foreground)]/55">Workspace / Users</p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Users</h1>
                <p className="mt-1 text-sm text-[var(--foreground)]/60">Ringkasan akun pengguna JBook.</p>
            </div>
            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"><Users size={20} /></span>
                <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">Direktori pengguna belum tersedia</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground)]/60">Backend saat ini menyediakan jumlah pengguna pada statistik dashboard, tetapi belum menyediakan endpoint admin untuk membaca atau mengelola daftar akun. Tidak ada data pengguna yang ditampilkan sampai API tersebut tersedia.</p>
                <Link href="/admin" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]">Lihat statistik dashboard <ArrowUpRight size={16} /></Link>
            </section>
        </div>
    );
}