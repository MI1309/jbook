import Link from 'next/link';

export default function AdminPageHeader({ title, description, breadcrumbs = [], action }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="mb-1 text-sm text-[var(--foreground)]/55">
                    <ol className="flex flex-wrap items-center gap-2">
                        <li><Link href="/admin" className="hover:text-[var(--foreground)]">Admin</Link></li>
                        {breadcrumbs.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2"><span aria-hidden="true">/</span>{item.href ? <Link href={item.href} className="hover:text-[var(--foreground)]">{item.label}</Link> : <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}
                    </ol>
                </nav>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
                {description && <p className="mt-1 text-sm text-[var(--foreground)]/60">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}