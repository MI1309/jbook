import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] w-full overflow-x-hidden washi-texture bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 pb-16">
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8 py-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-accent-blue transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Homepage
        </Link>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-6 md:p-8 book-page-shadow relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 p-2 sm:p-4 text-6xl sm:text-8xl font-japanese font-black text-gray-100 dark:text-white/[0.02] select-none pointer-events-none"
          >
            辞書
          </div>

          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-japanese font-black mb-3 sm:mb-4 text-accent-blue">
              Tentang JBook
            </h1>
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
              <p>
                JBook adalah kamus elektronik berbahasa Jepang, dengan arti yang sudah diartikan ke bahasa Indonesia, sehingga pembelajarannya semakin mudah.
              </p>
              <p>
                Disertai dengan teka-teki silang bahasa Jepang dan dashboard latihan untuk menguji kemampuan Anda secara interaktif dan menyenangkan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
