import { getBlogDetailBySlug } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const blog = await getBlogDetailBySlug(slug);
        return {
            title: `${blog.title} - JBook Blog`,
            description: blog.content.substring(0, 160).replace(/[#*`]/g, ''),
        };
    } catch (e) {
        return { title: 'Blog Not Found - JBook' };
    }
}

export default async function BlogDetailPage({ params }) {
    const { slug } = await params;
    
    let blog;
    try {
        blog = await getBlogDetailBySlug(slug);
    } catch (error) {
        notFound();
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Header / Backdrop */}
            <div className="bg-gray-50 py-16 border-b border-gray-100">
                <div className="container mx-auto px-6 max-w-4xl">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 transition-colors mb-8 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Blog
                    </Link>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                        {blog.tags.map(tag => (
                            <span key={tag} className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-red-100 text-red-600 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                        {blog.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-bold">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px]">JB</div>
                            <span>Tim JBook</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(blog.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="container mx-auto px-6 py-16 max-w-4xl">
                <div className="prose prose-lg prose-red max-w-none">
                    {/* Basic Markdown rendering for now until we have a proper library like react-markdown */}
                    {blog.content.split('\n').map((para, i) => (
                        <p key={i} className="mb-6 text-gray-700 leading-relaxed text-lg font-medium selection:bg-red-100 selection:text-red-900">
                            {para}
                        </p>
                    ))}
                </div>
                
                <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="font-black text-gray-900">Suka dengan artikel ini?</h4>
                        <p className="text-sm text-gray-500 font-medium">Bagikan ke teman belajar kamu!</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all active:scale-95">📱 Share</button>
                        <button className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all active:scale-95">🔗 Copy Link</button>
                    </div>
                </div>
            </article>
        </div>
    );
}
