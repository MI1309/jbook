'use client';

import Link from 'next/link';
import { 
    ArrowLeft, 
    Heart, 
    BookOpen, 
    Award, 
    Sparkles 
} from 'lucide-react';

export default function AboutPage() {

    return (
        <div className="relative min-h-screen washi-texture bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Header / Navigation bar */}
            <div className="container mx-auto px-6 max-w-3xl pt-8">
                
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-accent-blue transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Homepage
                </Link>

                <div className="text-center space-y-6 mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-bold tracking-widest uppercase text-accent-gold shadow-sm">
                        <Sparkles className="w-4 h-4 text-accent-gold" />
                        Filosofi JBook
                    </div>

                    <h1 className="text-4xl md:text-5xl font-japanese font-black tracking-tight leading-tight">
                        一期一会 <br/>
                        <span className="text-accent-blue font-sans">Satu Pertemuan, Satu Kesempatan</span>
                    </h1>

                    <p className="text-sm text-gray-400 dark:text-gray-500 font-light max-w-xl mx-auto italic">
                        &ldquo;Ichigo Ichie mengajarkan kita untuk menghargai setiap momen pembelajaran. Setiap halaman yang Anda buka adalah kesempatan unik yang tidak akan terulang dengan cara yang persis sama.&rdquo;
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    
                    {/* Vision Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 book-page-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-8xl font-japanese font-black text-gray-100 dark:text-white/[0.01] select-none pointer-events-none">
                            和
                        </div>
                        
                        <h3 className="text-lg font-japanese font-black mb-4 text-accent-blue">
                            Mengapa JBook Hadir?
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-light mb-4">
                            Belajar bahasa Jepang seringkali dirasa menakutkan karena kompleksitas aksara Kanji dan tata bahasa Keigo yang rumit. Terkadang platform pembelajaran komersial terlalu menekan pengguna dengan label &quot;Premium&quot; dan janji instan yang mengurangi kenyamanan belajar.
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                            <strong className="text-foreground">JBook dirancang dengan cara berbeda.</strong> Kami percaya bahwa belajar adalah sebuah perjalanan spiritual dan karir yang menenangkan. Terinspirasi oleh estetika Jepang minimalis, JBook hadir sebagai oase belajar yang bersih, bebas gangguan promosi keras, dan mengutamakan kedalaman konten yang mudah diakses kapan saja, bahkan saat offline.
                        </p>
                    </div>

                    {/* Misi Utama JBook */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8">
                        <h3 className="text-lg font-japanese font-black mb-6 text-accent-green">
                            Tiga Pilar Pembelajaran JBook
                        </h3>

                        <div className="space-y-6">
                            
                            {/* Pilar 1 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-foreground">Kedalaman Konten N4 & JLPT</h4>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light leading-relaxed">
                                        Menyediakan kurikulum terpadu untuk Kanji, Tata Bahasa, Huruf Kana, dan Kosakata tingkat dasar yang disajikan layaknya bab dalam buku fisik digital yang rapi dan mudah dicari.
                                    </p>
                                </div>
                            </div>

                            {/* Pilar 2 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-foreground">Persiapan Karir Berintegritas</h4>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light leading-relaxed">
                                        Melalui modul simulasi Mensetsu, JBook membekali Anda bukan hanya dengan kemampuan bahasa, tetapi juga dengan tata krama profesional (ojigi) yang sangat dihargai di Jepang.
                                    </p>
                                </div>
                            </div>

                            {/* Pilar 3 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center flex-shrink-0">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-foreground">Aksesibilitas Tanpa Batas</h4>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light leading-relaxed">
                                        Materi yang dapat diunduh untuk diakses secara luring (offline) memastikan proses belajar Anda tetap berjalan lancar di mana saja tanpa hambatan sinyal internet.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Cozy Call to Action */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 text-center border-b-4 border-b-accent-blue max-w-xl mx-auto">
                        <h4 className="text-base font-japanese font-black mb-2">
                            Mari Memulai Lembaran Baru Anda
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light mb-6">
                            Setiap pencapaian besar selalu diawali dari satu halaman kecil yang dibaca dengan bersungguh-sungguh.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link 
                                href="/practice" 
                                className="px-5 py-3 bg-accent-blue text-white rounded-xl text-xs font-bold hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/10 transition-all"
                            >
                                Mulai Latihan Ujian
                            </Link>
                            <Link 
                                href="/mensetsu" 
                                className="px-5 py-3 bg-white/5 border border-[var(--border-color)] hover:border-accent-green hover:text-accent-green text-gray-400 hover:text-foreground rounded-xl text-xs font-bold transition-all"
                            >
                                Latih Wawancara Kerja
                            </Link>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
