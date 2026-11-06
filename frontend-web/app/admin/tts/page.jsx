import Link from 'next/link';
import { ArrowUpRight, Mic2 } from 'lucide-react';

export default function AdminTtsPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <p className="text-sm text-[var(--foreground)]/55">Workspace / Moderasi TTS</p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Moderasi TTS</h1>
                <p className="mt-1 text-sm text-[var(--foreground)]/60">Status konten dan sesi TTS.</p>
            </div>
            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-green)]/10 text-[var(--accent-green)]"><Mic2 size={20} /></span>
                <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">Endpoint moderasi belum tersedia</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground)]/60">Backend menyediakan materi TTS untuk latihan, tetapi belum menyediakan API admin untuk meninjau atau memoderasi konten maupun sesi. Halaman ini tidak mengubah data.</p>
                <Link href="/tts" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]">Buka fitur TTS <ArrowUpRight size={16} /></Link>
            </section>
        </div>
    );
}