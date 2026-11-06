import Link from 'next/link';

export default function StatCard({ label, value, icon: Icon, href, color, loading }) {
    const content = (
        <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-colors ${href ? 'group-hover:border-[var(--foreground)]/25' : ''}`}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--foreground)]/60">{label}</p>
                <span className="flex size-9 items-center justify-center rounded-xl" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}><Icon size={18} strokeWidth={1.8} /></span>
            </div>
            {loading ? <div className="mt-5 h-9 w-24 animate-pulse rounded-lg bg-[var(--border-color)]" /> : <p className="mt-4 text-3xl font-bold tabular-nums text-[var(--foreground)]">{Number(value || 0).toLocaleString('id-ID')}</p>}
        </div>
    );

    return href ? <Link href={href} aria-label={`Kelola ${label}`} className="group block rounded-2xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]">{content}</Link> : content;
}