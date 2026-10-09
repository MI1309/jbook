import Link from 'next/link';

export default function Pagination({
    currentPage,
    totalPages,
    getHref,
    onPageChange,
    className = '',
    activeClassName = 'bg-accent-blue text-white border-accent-blue',
    buttonClassName = 'bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--border-color)] hover:border-accent-blue/50',
}) {
    const pageCount = Math.max(1, Number(totalPages) || 1);
    const page = Math.min(Math.max(1, Number(currentPage) || 1), pageCount);
    const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
    const lastPage = Math.min(pageCount, firstPage + 4);
    const pages = Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index);

    const renderControl = (targetPage, label, disabled = false, active = false) => {
        const classes = `inline-flex min-w-10 h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
            active ? activeClassName : buttonClassName
        } ${disabled ? 'pointer-events-none opacity-40' : 'hover:text-accent-blue'} ${className}`;

        if (getHref) {
            return (
                <Link
                    key={label}
                    href={getHref(targetPage)}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={disabled}
                    className={classes}
                    tabIndex={disabled ? -1 : undefined}
                >
                    {label}
                </Link>
            );
        }

        return (
            <button
                key={label}
                type="button"
                onClick={() => onPageChange?.(targetPage)}
                disabled={disabled}
                aria-current={active ? 'page' : undefined}
                className={classes}
            >
                {label}
            </button>
        );
    };

    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
            {renderControl(page - 1, '←', page <= 1)}
            {pages.map((pageNumber) => renderControl(pageNumber, pageNumber, false, pageNumber === page))}
            {renderControl(page + 1, '→', page >= pageCount)}
        </nav>
    );
}