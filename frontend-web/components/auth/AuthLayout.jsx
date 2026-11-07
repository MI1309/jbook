import Image from 'next/image';
import Link from 'next/link';

export const authLabelClass = 'mb-2 block text-sm font-semibold text-[var(--foreground)]';
export const authInputClass = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-gray-400 focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]/25';
export const authButtonClass = 'inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--auth-accent)] px-4 py-3 text-sm font-bold text-[var(--auth-accent-contrast)] transition-colors hover:bg-[var(--auth-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--auth-accent)] disabled:cursor-not-allowed disabled:opacity-60';
export const authIconButtonClass = 'absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-md text-[var(--auth-muted)] transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--auth-accent)] dark:hover:bg-white/5';
export const authLinkClass = 'font-semibold text-[var(--auth-accent)] hover:underline';

export default function AuthLayout({ eyebrow, title, description, children }) {
    return (
        <div className="min-h-svh bg-[var(--auth-background)] px-4 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto grid min-h-[calc(100svh-2.5rem)] max-w-6xl overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_24px_80px_-40px_var(--auth-shadow)] sm:min-h-[calc(100svh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--auth-illustration)] p-10 text-white lg:flex xl:p-14">
                    <div className="absolute -right-20 top-1/3 select-none font-japanese text-[20rem] leading-none text-white/[0.035]" aria-hidden="true">文</div>
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="rounded-lg bg-white p-1.5">
                            <Image src="/icon-192.png" alt="" width={42} height={42} priority className="h-10 w-10 rounded-md" />
                        </div>
                        <span className="text-xl font-bold">JBook</span>
                    </div>

                    <div className="relative z-10 max-w-md py-12">
                        <p className="mb-4 text-xs font-bold uppercase text-[var(--auth-illustration-copy)]">Belajar bahasa Jepang</p>
                        <p className="font-japanese text-4xl font-bold leading-tight xl:text-5xl">Sedikit demi sedikit, semakin mengerti.</p>
                        <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Bangun kebiasaan belajar yang terasa ringan, dari kana hingga tata bahasa.</p>
                    </div>

                    <div className="relative z-10 border-t border-white/15 pt-5">
                        <div className="flex items-center justify-between text-xs font-semibold text-white/65">
                            <span>JALUR BELAJAR</span>
                            <span>N5 — N1</span>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
                            {['#b8d5be', '#8ebca0', '#3e4df3', '#d2b56c', '#d77f68'].map((color) => (
                                <span key={color} className="h-1 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>
                </aside>

                <section aria-labelledby="auth-title" className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
                    <div className="mx-auto w-full max-w-md">
                        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] lg:hidden">
                            <Image src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md" />
                            JBook
                        </Link>
                        <p className="text-xs font-bold uppercase text-[var(--auth-accent)]">{eyebrow}</p>
                        <h1 id="auth-title" className="mt-2 text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
                        <p className="mt-3 text-sm leading-6 text-[var(--auth-muted)]">{description}</p>
                        <div className="mt-8">{children}</div>
                        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] pt-5 text-xs font-semibold text-gray-500">
                            <Link href="/privacy-security" className="transition-colors hover:text-[var(--auth-accent)]">Privasi &amp; Keamanan</Link>
                            <Link href="/" className="transition-colors hover:text-[var(--auth-accent)]">Kembali ke beranda</Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}