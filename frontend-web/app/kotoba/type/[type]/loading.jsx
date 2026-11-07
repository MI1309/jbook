export default function KotobaTypeLoading() {
    return (
        <main aria-label="Memuat kategori Kotoba" className="mx-auto w-full max-w-7xl animate-pulse px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="h-4 w-44 rounded bg-[var(--border-color)]" />
            <div className="mt-6 grid gap-6 border-b border-[var(--border-color)] pb-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-3"><div className="h-6 w-32 rounded-full bg-[var(--border-color)]" /><div className="h-9 w-64 rounded-lg bg-[var(--border-color)]" /><div className="h-5 max-w-xl rounded bg-[var(--border-color)]" /></div>
                <div className="h-12 rounded-xl bg-[var(--border-color)]" />
            </div>
            <div className="mt-6 flex gap-2"><div className="h-11 w-20 rounded-full bg-[var(--border-color)]" /><div className="h-11 w-12 rounded-full bg-[var(--border-color)]" /><div className="h-11 w-12 rounded-full bg-[var(--border-color)]" /></div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-44 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]" />)}</div>
        </main>
    );
}