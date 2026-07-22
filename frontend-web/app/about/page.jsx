'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {

    return (
        <div className="relative min-h-screen washi-texture bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Header / Navigation bar */}
            <div className="container mx-auto px-6 max-w-3xl pt-8">
                
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-accent-blue transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Homepage
                </Link>



                {/* Main Content */}
                <div className="space-y-8">
                    
                    {/* About JBook Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 book-page-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-8xl font-japanese font-black text-gray-100 dark:text-white/[0.01] select-none pointer-events-none">
                            辞書
                        </div>
                        
                        <h3 className="text-2xl font-japanese font-black mb-4 text-accent-blue">
                            Tentang JBook
                        </h3>
                        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mb-4">
                            JBook adalah kamus elektronik berbahasa Jepang, dengan arti yang sudah diartikan ke bahasa Indonesia, sehingga pembelajarannya semakin mudah. 
                        </p>
                        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                            Disertai dengan teka-teki silang bahasa Jepang dan dashboard latihan untuk menguji kemampuan Anda secara interaktif dan menyenangkan.
                        </p>
                    </div>



                </div>

            </div>
        </div>
    );
}
