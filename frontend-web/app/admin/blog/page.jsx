'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function BlogAdmin() {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ title: '', slug: '', content: '', tags: '', is_published: false });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('https://imronm.pythonanywhere.com/api/admin/blog', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBlogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch blogs", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const tagsArray = formData.tags.split(',').map(tag => tag.trim());
            const payload = { ...formData, tags: tagsArray };

            const res = await fetch('https://imronm.pythonanywhere.com/api/admin/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreating(false);
                setFormData({ title: '', slug: '', content: '', tags: '', is_published: false });
                fetchBlogs();
            }
        } catch (error) {
            console.error("Failed to create blog", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Blog Management</h1>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                    {isCreating ? 'Cancel' : '+ New Post'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow mb-8 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Create New Post</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
                            <textarea
                                rows="10"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border font-mono"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={formData.is_published}
                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                            />
                            <label className="ml-2 block text-sm text-gray-900">Publish Immediately</label>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                            Save Post
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {blogs.map((blog) => (
                        <li key={blog.id}>
                            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-red-600 truncate">{blog.title}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {blog.is_published ? 'Published' : 'Draft'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {blog.slug}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {/* Edit/Delete buttons could go here */}
                                    <span className="text-gray-400 text-xs">ID: {blog.id}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {blogs.length === 0 && (
                        <li className="px-4 py-4 text-center text-gray-500">
                            No blog posts found.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
