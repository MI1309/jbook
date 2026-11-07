'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import {
    BookOpen, ChevronLeft, ChevronRight, CircleHelp, House, LayoutDashboard,
    Bell, Database, Download, LogOut, Menu, Mic2, Moon, Search, Sun, Users, X, AudioLines,
} from 'lucide-react';

const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/bunpo', label: 'Bunpo', icon: BookOpen },
    { href: '/admin/kotoba', label: 'Kotoba', icon: AudioLines },
    { href: '/admin/announcements', label: 'Pengumuman', icon: Bell },
    { href: '/admin/custom-modules', label: 'Modul Kustom', icon: Database },
    { href: '/admin/tts', label: 'Moderasi TTS', icon: Mic2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/export', label: 'Export', icon: Download },
];

function Sidebar({ collapsed, onCollapse, onClose }) {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <div className="flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className={`flex h-[72px] items-center border-b border-[var(--border-color)] ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
                <Link href="/admin" onClick={onClose} className="flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-red)] text-lg font-bold text-white">J</span>
                    {!collapsed && <span className="truncate text-sm font-semibold text-[var(--foreground)]">JBook <span className="font-normal text-[var(--foreground)]/55">Admin</span></span>}
                </Link>
                {onClose ? (
                    <button type="button" onClick={onClose} aria-label="Tutup navigasi" className="rounded-lg p-2 text-[var(--foreground)]/65 transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><X size={18} /></button>
                ) : !collapsed ? (
                    <button type="button" onClick={onCollapse} aria-label="Ciutkan navigasi" className="rounded-lg p-2 text-[var(--foreground)]/65 transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ChevronLeft size={17} /></button>
                ) : null}
            </div>

            {collapsed && !onClose && <button type="button" onClick={onCollapse} aria-label="Perluas navigasi" className="mx-auto mt-4 rounded-lg p-2 text-[var(--foreground)]/65 transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ChevronRight size={17} /></button>}

            <nav aria-label="Navigasi admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
                {!collapsed && <p className="mb-3 px-3 text-[11px] font-medium uppercase tracking-wide text-[var(--foreground)]/45">Workspace</p>}
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
                    return <Link key={href} href={href} onClick={onClose} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] ${collapsed ? 'justify-center' : ''} ${active ? 'border border-[var(--brand-red)]/20 bg-[var(--brand-red)]/10 font-medium text-[var(--brand-red)]' : 'text-[var(--foreground)]/70 hover:bg-[var(--background)] hover:text-[var(--foreground)]'}`}>
                        <Icon size={18} strokeWidth={1.8} />{!collapsed && <span>{label}</span>}
                    </Link>;
                })}

            </nav>

            <div className={`border-t border-[var(--border-color)] p-3 ${collapsed ? 'text-center' : ''}`}>
                <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'justify-center' : ''}`}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/15 text-xs font-semibold text-[var(--accent-blue)]">{user?.username?.[0]?.toUpperCase() ?? 'A'}</span>
                    {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--foreground)]">{user?.username ?? 'Admin'}</p><p className="text-xs text-[var(--foreground)]/50">Administrator</p></div>}
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [apiOnline, setApiOnline] = useState(null);
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const pageTitle = navItems.find(item => item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href))?.label ?? 'Admin';
    const isAuthorized = !loading && !!user?.is_staff;

    useEffect(() => {
        if (!loading) {
            if (!user) router.replace('/login');
            else if (!user.is_staff) router.replace('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!isAuthorized) return undefined;
        let cancelled = false;
        fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } })
            .then(response => {
                if (!response.ok) throw new Error('Admin API unavailable');
                if (!cancelled) setApiOnline(true);
            })
            .catch(() => { if (!cancelled) setApiOnline(false); });
        return () => { cancelled = true; };
    }, [isAuthorized]);

    useEffect(() => {
        if (!drawerOpen && !profileOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setDrawerOpen(false);
                setProfileOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drawerOpen, profileOpen]);

    if (loading || !isAuthorized) return <div className="min-h-screen bg-[var(--background)] p-6"><div className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-12 w-56 rounded-xl bg-[var(--border-color)]" /><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map(item => <div key={item} className="h-32 rounded-2xl bg-[var(--card-bg)]" />)}</div><div className="h-72 rounded-2xl bg-[var(--card-bg)]" /></div></div>;

    return (
        <div className="flex h-dvh min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            <aside className={`hidden shrink-0 transition-[width] duration-200 lg:block ${collapsed ? 'w-[76px]' : 'w-[250px]'}`}><Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} /></aside>
            {drawerOpen && <button type="button" aria-label="Tutup navigasi" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" />}
            <aside id="admin-mobile-navigation" role={drawerOpen ? 'dialog' : undefined} aria-modal={drawerOpen ? 'true' : undefined} aria-label={drawerOpen ? 'Navigasi admin' : undefined} aria-hidden={!drawerOpen} inert={!drawerOpen} className={`fixed inset-y-0 left-0 z-50 w-[min(280px,calc(100vw-2.5rem))] transform transition-transform duration-200 lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}><Sidebar collapsed={false} onClose={() => setDrawerOpen(false)} /></aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--background)]/95 px-4 backdrop-blur sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls="admin-mobile-navigation" aria-label="Buka navigasi" className="rounded-lg p-2 text-[var(--foreground)]/70 transition-colors hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] lg:hidden"><Menu size={19} /></button>
                        <h1 className="hidden shrink-0 text-sm font-semibold text-[var(--foreground)] sm:block">{pageTitle}</h1>
                        <label className="flex h-10 w-full max-w-[420px] items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-[var(--foreground)]/50 transition-colors focus-within:border-[var(--accent-blue)]"><Search size={17} /><input aria-label="Cari di admin" placeholder="Cari konten..." className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus-visible:outline-none" /><kbd className="hidden rounded border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] sm:inline">/</kbd></label>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <div className={`hidden items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs sm:flex ${apiOnline ? 'border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)]/55'}`}><span className={`size-1.5 rounded-full ${apiOnline ? 'bg-[var(--accent-green)]' : 'bg-[var(--foreground)]/35'}`} />{apiOnline === null ? 'Memeriksa API' : apiOnline ? 'API Online' : 'API Offline'}</div>
                        <Link href="/" aria-label="Kembali ke beranda" title="Kembali ke beranda" className="inline-flex items-center gap-2 rounded-lg p-2 text-sm text-[var(--foreground)]/70 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><House size={18} /><span className="hidden xl:inline">Beranda</span></Link>
                        <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'} title={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'} className="rounded-lg p-2 text-[var(--foreground)]/70 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                        <div className="relative">
                            <button type="button" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen} aria-label="Buka menu profil" className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand-red)]/12 text-xs font-semibold text-[var(--brand-red)]">{user?.username?.[0]?.toUpperCase() ?? 'A'}</span><span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user?.username ?? 'Admin'}</span></button>
                            {profileOpen && <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-xl"><p className="truncate px-3 py-2 text-xs text-[var(--foreground)]/55">{user?.username ?? 'Admin'}</p><Link href="/" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Kembali ke situs</Link><button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><LogOut size={16} /> Keluar</button></div>}
                        </div>
                        <button type="button" title="Bantuan" className="hidden rounded-lg p-2 text-[var(--foreground)]/55 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:block"><CircleHelp size={18} /></button>
                    </div>
                </header>
                <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}