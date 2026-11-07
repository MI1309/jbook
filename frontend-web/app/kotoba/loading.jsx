export default function KotobaLoading() {
    return (
        <main aria-label="Memuat Kotoba" className="mx-auto w-full max-w-7xl animate-pulse px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-6 border-b border-[var(--border-color)] pb-8 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-3"><div className="h-6 w-28 rounded-full bg-[var(--border-color)]" /><div className="h-10 w-64 rounded-lg bg-[var(--border-color)]" /><div className="h-5 max-w-lg rounded bg-[var(--border-color)]" /></div>
                <div className="h-12 rounded-xl bg-[var(--border-color)]" />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-56 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]" />)}</div>
        </main>
    );
}