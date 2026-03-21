import { getBlogList } from '@/lib/api';
import Link from 'next/link';

export const metadata = {
    title: 'Blog JBook - Tips & Wawasan Belajar Bahasa Jepang',
    description: 'Kumpulan artikel, tips, dan cerita menarik seputar perjalanan belajar bahasa Jepang kamu di JBook.',
};

export default async function BlogListPage() {
    let blogs = [];
    try {
        blogs = await getBlogList();
    } catch (error) {
        console.error('Failed to fetch blogs during prerender:', error.message);
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl">
            <header className="mb-16 text-center">
                <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">
                    JBook <span className="text-red-600">Blog</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg">Wawasan, Tips, dan Cerita seputar belajar Bahasa Jepang</p>
                <div className="w-24 h-1 bg-red-600 mx-auto mt-6 rounded-full"></div>
            </header>

            {blogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {blogs.map((blog) => (
                        <Link key={blog.id} href={`/blog/${blog.slug}`} className="group">
                            <article className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all h-full flex flex-col active:scale-[0.98]">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {blog.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors mb-4 leading-tight line-clamp-2">
                                    {blog.title}
                                </h2>
                                <p className="text-gray-500 line-clamp-3 mb-6 text-sm leading-relaxed flex-1">
                                    {blog.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                    <span className="text-xs font-bold text-gray-400">
                                        {new Date(blog.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="text-xs font-black text-red-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Baca Selengkapnya <span>→</span>
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-6">🏜️</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Belum ada postingan</h2>
                    <p className="text-gray-400 font-medium">Nantikan update terbaru dari kami segera!</p>
                </div>
            )}
        </div>
    );
}
