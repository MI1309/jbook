'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';

export default function CustomPracticePage() {
    const { theme } = useTheme();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const data = await jbookApi.getCustomModules();
                setModules(data);
            } catch (error) {
                console.error("Failed to fetch modules", error);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    if (loading) return <div className="p-8 text-center min-h-screen">Loading...</div>;

    return (
        <div className={`min-h-screen py-12 ${theme === 'dark' ? 'bg-[#020202] text-neutral-200' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-5xl mx-auto px-6">
                <div className="mb-8">
                    <Link href="/practice" className="text-red-500 hover:underline text-sm font-bold uppercase tracking-widest mb-4 inline-block">
                        ← Kembali ke Menu Latihan
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Latihan Tambahan</h1>
                    <p className="opacity-70">Modul latihan khusus yang disusun oleh pengajar (Dokkai, Choukai, dll).</p>
                </div>

                {modules.length === 0 ? (
                    <div className="text-center py-20 opacity-50 border border-dashed rounded-2xl">
                        Belum ada modul latihan yang tersedia saat ini.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {modules.map(module => (
                            <Link 
                                href={`/practice/custom/${module.id}`} 
                                key={module.id} 
                                className={`block p-6 rounded-2xl border transition-transform hover:-translate-y-1 hover:shadow-xl ${
                                    theme === 'dark' 
                                    ? 'bg-[#0a0a0a] border-white/5 hover:border-red-500/30' 
                                    : 'bg-white border-gray-200 hover:border-red-500'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold line-clamp-2">{module.title}</h2>
                                </div>
                                <p className="text-sm opacity-70 mb-6 line-clamp-3">{module.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-black tracking-widest px-2 py-1 bg-red-100 text-red-600 rounded">
                                        {module.module_type}
                                    </span>
                                    <span className="text-red-500 text-sm font-bold group-hover:underline">Mulai →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
