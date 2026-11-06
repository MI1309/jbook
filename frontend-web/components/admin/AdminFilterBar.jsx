export default function AdminFilterBar({ children, onReset, className = '' }) {
    return (
        <div className={`flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:flex-row sm:flex-wrap sm:items-center ${className}`}>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
            {onReset && <button type="button" onClick={onReset} className="shrink-0 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)]/70 transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Reset filter</button>}
        </div>
    );
}