'use client';

import { useState, Suspense } from 'react';
import { API_URL } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

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
                alert("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-gray-100 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Kategori Data</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'kanji', label: 'Kanji', icon: '🉐' }, { id: 'vocab', label: 'Kotoba', icon: '🗣️' }, { id: 'bunpo', label: 'Bunpo', icon: '📚' }, { id: 'particle', label: 'Partikel', icon: '⚓' }].map((cat) => (
                            <button key={cat.id} onClick={() => setType(cat.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${type === cat.id ? 'border-red-500 bg-red-50 text-red-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}>
                                <span className="text-2xl mb-1">{cat.icon}</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">JLPT Level</label>
                        <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 focus:border-red-500 outline-none" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="">Semua Level</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Pencarian Kata/Arti</label>
                        <input type="text" placeholder="Contoh: Taberu..." className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 focus:border-red-500 outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {type === 'bunpo' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Chapter (Bab)</label>
                            <input type="number" placeholder="Nomor Bab" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 focus:border-red-500 outline-none" value={chapter} onChange={(e) => setChapter(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-6 flex items-center gap-2">CSV Tanpa ID.</p>
                <button onClick={handleExport} disabled={loading} className={`group relative w-full md:w-64 py-4 rounded-2xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                    {loading ? <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <><span>📥</span><span>Download CSV</span></>}
                </button>
            </div>
        </div>
    );
}

export default function ExportPage() {
    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
             <div className="flex items-center gap-4 mb-8">
                <h1 className="text-3xl font-black text-gray-900">Export Data Lanjutan</h1>
            </div>

            <Suspense fallback={<div className="bg-white p-10 text-center rounded-3xl animate-pulse">Menyiapkan form...</div>}>
                <ExportContent />
            </Suspense>

            <div className="mt-10 text-center">
                <Link href="/admin" className="text-gray-400 hover:text-red-600 transition-colors text-sm font-bold no-underline uppercase tracking-widest">
                    Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}
