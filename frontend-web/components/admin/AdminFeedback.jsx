import Link from 'next/link';
import { AlertTriangle, ArrowRight, Database } from 'lucide-react';

export function AdminSkeleton({ rows = 4, className = '' }) {
    return (
        <div className={`animate-pulse space-y-3 p-5 sm:p-6 ${className}`} aria-label="Memuat data" role="status">
            <span className="sr-only">Memuat data...</span>
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="h-12 rounded-lg bg-[var(--background)]" />
            ))}
        </div>
    );
}

export function AdminErrorState({ title = 'Data gagal dimuat', message, onRetry }) {
    return (
        <div className="rounded-2xl border border-[var(--brand-red)]/25 bg-[var(--brand-red-light)] p-6 text-center sm:p-8" role="alert">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--brand-red)]/10 text-[var(--brand-red)]">
                <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-base font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[var(--foreground)]/65">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-xl border border-[var(--brand-red)]/30 px-4 py-2 text-sm font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
                >
                    Coba lagi
                </button>
            )}
        </div>
    );
}

export function AdminEmptyState({ title, message, href, actionLabel, icon: Icon = Database }) {
    return (
        <div className="px-6 py-12 text-center">
            <Icon size={30} className="mx-auto text-[var(--foreground)]/35" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--foreground)]/55">{message}</p>
            {href && actionLabel && (
                <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
                >
                    {actionLabel}<ArrowRight size={15} aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}