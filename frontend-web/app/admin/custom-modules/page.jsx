'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';

export default function AdminCustomModulesPage() {
    const { theme } = useTheme();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        module_type: 'general',
        passage: '',
        audio_url: '',
        is_published: false
    });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const data = await jbookApi.adminGetCustomModules();
            setModules(data);
        } catch (error) {
            console.error("Failed to fetch modules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await jbookApi.adminCreateCustomModule(formData);
            setIsCreating(false);
            setFormData({ title: '', description: '', module_type: 'general', passage: '', audio_url: '', is_published: false });
            fetchModules();
        } catch (error) {
            console.error("Failed to create module", error);
            alert("Gagal membuat modul");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus modul ini?")) {
            try {
                await jbookApi.adminDeleteCustomModule(id);
                fetchModules();
            } catch (error) {
                console.error("Failed to delete module", error);
                alert("Gagal menghapus modul");
            }
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modul Latihan Kustom</h1>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    + Buat Modul
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'} space-y-4`}>
                    <h2 className="text-xl font-semibold">Buat Modul Baru</h2>
                    <div>
                        <label className="block text-sm font-medium mb-1">Judul Modul</label>
                        <input required type="text" className="w-full p-2 border rounded-lg bg-transparent" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi</label>
                        <textarea className="w-full p-2 border rounded-lg bg-transparent" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipe Modul</label>
                        <select className="w-full p-2 border rounded-lg bg-transparent" value={formData.module_type} onChange={e => setFormData({...formData, module_type: e.target.value})}>
                            <option value="general">Umum (Campuran)</option>
                            <option value="dokkai">Dokkai (Membaca)</option>
                            <option value="choukai">Choukai (Mendengar)</option>
                        </select>
                    </div>
                    {formData.module_type === 'dokkai' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Teks Cerita / Passage</label>
                            <textarea className="w-full p-2 border rounded-lg bg-transparent" rows="4" value={formData.passage} onChange={e => setFormData({...formData, passage: e.target.value})}></textarea>
                        </div>
                    )}
                    {formData.module_type === 'choukai' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">URL Audio</label>
                            <input type="text" className="w-full p-2 border rounded-lg bg-transparent" value={formData.audio_url} onChange={e => setFormData({...formData, audio_url: e.target.value})} />
                        </div>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Simpan</button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.map(module => (
                    <div key={module.id} className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'} flex flex-col`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg line-clamp-1">{module.title}</h3>
                            <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${module.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {module.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <p className="text-sm opacity-70 mb-4 flex-1 line-clamp-2">{module.description}</p>
                        <div className="flex justify-between items-center text-xs opacity-60 mb-4 uppercase font-bold tracking-wider">
                            <span>{module.module_type}</span>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/admin/custom-modules/${module.id}`} className="flex-1 text-center py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                                Kelola Soal
                            </Link>
                            <button onClick={() => handleDelete(module.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
                {modules.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 opacity-50">Belum ada modul kustom.</div>
                )}
            </div>
        </div>
    );
}
