'use client';

import { useState, Suspense } from 'react';
import { API_URL } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { toast } from 'react-toastify';

function ExportContent() {
    const searchParams = useSearchParams();
    
    const [type, setType] = useState(searchParams.get('type') || 'kanji');
    const [level, setLevel] = useState('');
    const [search, setSearch] = useState('');
    const [chapter, setChapter] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (search) queryParams.append('search', search);
            if (chapter) queryParams.append('chapter', chapter);
            
            const endpoint = type === 'vocab' || type === 'kotoba' ? 'vocab' : (type === 'bunpo' ? 'bunpo' : type);
            const res = await fetch(`${API_URL}/admin/${endpoint}/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`backdrop-blur-xl border transition-all duration-300 relative z-10 p-10 rounded-[2.5rem] ${
            loading ? 'opacity-70 grayscale' : ''
        } bg-white/5 border-white/5 shadow-[0_0_50px_-12px_rgba(220,38,38,0.1)]`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Kategori Data</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'kanji', label: 'Kanji', icon: '🉐', color: 'from-red-500 to-red-700' }, 
                            { id: 'vocab', label: 'Kotoba', icon: '🗣️', color: 'from-blue-500 to-blue-700' }, 
                            { id: 'bunpo', label: 'Bunpo', icon: '📚', color: 'from-amber-500 to-amber-700' }, 
                            { id: 'particle', label: 'Partikel', icon: '⚓', color: 'from-emerald-500 to-emerald-700' }
                        ].map((cat) => (
                            <button 
                                key={cat.id} 
                                onClick={() => setType(cat.id)} 
                                className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all active:scale-95 overflow-hidden ${
                                    type === cat.id 
                                        ? 'border-red-600 bg-red-600/10 text-white shadow-lg shadow-red-600/20' 
                                        : 'border-white/5 bg-white/5 text-neutral-500 hover:border-white/20 hover:bg-white/10'
                                }`}
                            >
                                <span className={`text-3xl mb-3 transition-transform group-hover:scale-125 duration-500 ${type === cat.id ? 'animate-bounce' : ''}`}>{cat.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                {type === cat.id && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3 ml-1 group-focus-within:text-red-500 transition-colors">JLPT Level</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl p-4 font-bold text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-600/50 hover:bg-neutral-900 transition-all cursor-pointer"
                                value={level} 
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="" className="bg-[#050505]">Semua Level</option>
                                <option value="5" className="bg-[#050505]">N5 - Dasar</option>
                                <option value="4" className="bg-[#050505]">N4 - Dasar Lanjut</option>
                                <option value="3" className="bg-[#050505]">N3 - Menengah</option>
                                <option value="2" className="bg-[#050505]">N2 - Menengah Lanjut</option>
                                <option value="1" className="bg-[#050505]">N1 - Mahir</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3 ml-1 group-focus-within:text-red-500 transition-colors">Pencarian Kata/Arti</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: Taberu..." 
                            className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl p-4 font-bold text-sm text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-600/50 hover:bg-neutral-900 transition-all"
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>

                    {type === 'bunpo' && (
                        <div className="group animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3 ml-1 group-focus-within:text-red-500 transition-colors">Chapter (Bab)</label>
                            <input 
                                type="number" 
                                placeholder="Nomor Bab" 
                                className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl p-4 font-bold text-sm text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-600/50 hover:bg-neutral-900 transition-all"
                                value={chapter} 
                                onChange={(e) => setChapter(e.target.value)} 
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">CSV Tanpa ID (Export Standar)</span>
                </div>
                
                <button 
                    onClick={handleExport} 
                    disabled={loading} 
                    className={`group relative w-full md:w-80 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-2xl active:scale-95 overflow-hidden ${
                        loading ? 'bg-neutral-800 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                    }`}
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Mengekspor...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download CSV
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function ExportPage() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4 animate-in fade-in slide-in-from-left-4 duration-700">
                        Export Data <span className="text-red-600">Lanjutan</span>
                    </h1>
                    <p className="text-sm font-bold text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-red-600"></span>
                        Admin Control Panel
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="bg-white/5 backdrop-blur-xl p-20 text-center rounded-[2.5rem] border border-white/5 animate-pulse">
                    <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Menyiapkan Form...</span>
                </div>
            }>
                <ExportContent />
            </Suspense>

            <div className="mt-16 text-center">
                <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-700 hover:text-white transition-all hover:scale-105">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}

