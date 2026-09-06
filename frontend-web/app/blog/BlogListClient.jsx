'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

function getFullMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return `${apiUrl.replace(/\/api\/?$/, '')}/${url.replace(/^\//, '')}`;
}

function cleanExcerpt(text) {
    if (!text) return '';
    return text.replace(/[#*`_~\[\]()><\\]/g, '').replace(/\s+/g, ' ').trim();
}

export default function BlogListClient({ initialBlogs = [] }) {
    const [selectedTag, setSelectedTag] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Extract unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set();
        initialBlogs.forEach((blog) => {
            if (Array.isArray(blog.tags)) {
                blog.tags.forEach((tag) => tagSet.add(tag));
            }
        });
        return Array.from(tagSet);
    }, [initialBlogs]);

    // Filter blogs
    const filteredBlogs = useMemo(() => {
        return initialBlogs.filter((blog) => {
            const matchesTag =
                selectedTag === 'all' ||
                (Array.isArray(blog.tags) && blog.tags.includes(selectedTag));

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (blog.title && blog.title.toLowerCase().includes(q)) ||
                (blog.excerpt && blog.excerpt.toLowerCase().includes(q)) ||
                (blog.content && blog.content.toLowerCase().includes(q)) ||
                (Array.isArray(blog.tags) && blog.tags.some((t) => t.toLowerCase().includes(q)));

            return matchesTag && matchesSearch;
        });
    }, [initialBlogs, selectedTag, searchQuery]);

    return (
        <div className="space-y-10">
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="relative">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari topik, tips, kanji, bunpo, atau JLPT..."
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 focus:border-red-500 focus:bg-white focus:outline-none text-gray-800 text-sm md:text-base font-medium transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Tags Filter Chips */}
                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedTag('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                selectedTag === 'all'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Semua ({initialBlogs.length})
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTag(tag)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    selectedTag === tag
                                        ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Blog Grid */}
            {filteredBlogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBlogs.map((blog) => {
                        const featuredImg = getFullMediaUrl(blog.featured_image_url);
                        const snippet = blog.excerpt
                            ? cleanExcerpt(blog.excerpt)
                            : cleanExcerpt(blog.content).substring(0, 140);
                        const wordCount = (blog.content || '').trim().split(/\s+/).filter(Boolean).length;
                        const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

                        return (
                            <Link key={blog.id} href={`/blog/${blog.slug}`} className="group block h-full">
                                <article className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-red-500/10 transition-all h-full flex flex-col active:scale-[0.99]">
                                    {/* Featured Image */}
                                    <div className="aspect-[16/9] bg-gray-50 overflow-hidden relative">
                                        {featuredImg ? (
                                            <img
                                                src={featuredImg}
                                                alt={blog.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
                                                <div className="text-5xl opacity-30">📝</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {blog.tags &&
                                                blog.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full group-hover:bg-red-50 group-hover:text-red-600 transition-colors"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-xl font-black text-gray-900 group-hover:text-red-600 transition-colors mb-3 leading-tight line-clamp-2">
                                            {blog.title}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-gray-500 line-clamp-3 mb-6 text-sm leading-relaxed flex-1">
                                            {snippet}...
                                        </p>

                                        {/* Footer: Date & Reading Time */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                                                <time dateTime={blog.created_at}>
                                                    {new Date(blog.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </time>
                                                <span>•</span>
                                                <span>⏱️ {readingMinutes}m</span>
                                            </div>
                                            <span className="font-black text-red-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Baca <span>→</span>
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Tidak ada artikel ditemukan</h3>
                    <p className="text-gray-500 text-sm font-medium mb-6">
                        Coba gunakan kata kunci lain atau pilih kategori lain.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedTag('all');
                            setSearchQuery('');
                        }}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Reset Pencarian
                    </button>
                </div>
            )}
        </div>
    );
}
