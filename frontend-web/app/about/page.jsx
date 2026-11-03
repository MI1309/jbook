import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  ChartNoAxesCombined,
  Gamepad2,
  Languages,
  Lightbulb,
  ShieldCheck,
  Type,
  UsersRound,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Kamus Kanji',
    description: 'Jelajahi arti dan cara baca kanji dengan penjelasan berbahasa Indonesia.',
    href: '/kanji',
    label: 'Jelajahi Kanji',
    tone: 'blue',
  },
  {
    icon: Languages,
    title: 'Kotoba (Kosakata)',
    description: 'Cari kosakata Jepang beserta bacaan dan maknanya.',
    href: '/kotoba',
    label: 'Buka Kotoba',
    tone: 'green',
  },
  {
    icon: BookMarked,
    title: 'Bunpo (Tata Bahasa)',
    description: 'Pelajari pola tata bahasa dan contoh penggunaannya.',
    href: '/bunpo',
    label: 'Pelajari Bunpo',
    tone: 'gold',
  },
  {
    icon: Type,
    title: 'Kana',
    description: 'Kenali Hiragana dan Katakana melalui tabel huruf interaktif.',
    href: '/kana',
    label: 'Belajar Kana',
    tone: 'red',
  },
  {
    icon: Brain,
    title: 'Latihan Soal',
    description: 'Uji pemahaman Kanji, kosakata, dan tata bahasa.',
    href: '/practice',
    label: 'Mulai Latihan',
    tone: 'blue',
  },
  {
    icon: Gamepad2,
    title: 'Game TTS',
    description: 'Latih ingatan lewat teka-teki silang kosakata Jepang.',
    href: '/tts',
    label: 'Coba Game TTS',
    tone: 'green',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Dashboard Progress',
    description: 'Lihat ringkasan hasil latihan dan perjalanan belajar akunmu.',
    href: '/dashboard',
    label: 'Lihat Dashboard',
    tone: 'gold',
  },
];

const learners = [
  {
    icon: Type,
    title: 'Pemula',
    description: 'Mulai dari Hiragana dan Katakana, lalu bangun fondasi kosakata dan kanji.',
  },
  {
    icon: BookMarked,
    title: 'Pembelajar JLPT',
    description: 'Gunakan materi dan latihan untuk belajar bertahap sesuai target level.',
  },
  {
    icon: UsersRound,
    title: 'Pembelajar Mandiri',
    description: 'Pilih materi sesuai kebutuhan dan pantau aktivitas belajar dari dashboard.',
  },
];

const toneClasses = {
  blue: 'bg-accent-blue/10 text-accent-blue',
  green: 'bg-accent-green/10 text-accent-green',
  gold: 'bg-accent-gold/10 text-accent-gold',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function AboutPage() {
  return (
    <main className="relative w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] washi-texture">
      <div aria-hidden="true" className="pointer-events-none absolute right-3 top-24 hidden select-none font-japanese text-5xl font-black text-foreground/[0.035] sm:right-8 sm:top-16 sm:block sm:text-8xl">
        日本語
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 pt-4 text-sm font-semibold text-gray-600 transition-colors hover:text-accent-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue dark:text-gray-300"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <section aria-labelledby="about-title" className="relative grid min-h-[440px] items-center gap-8 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-xs font-bold uppercase text-accent-blue">
              <span className="font-japanese text-base" aria-hidden="true">辞書 · 学習</span>
              <span>Tentang JBook</span>
            </span>
            <h1 id="about-title" className="mt-5 text-4xl font-japanese font-black leading-tight sm:text-5xl lg:text-6xl">
              Tentang JBook
              <span className="mt-1 block bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">Belajar Jepang, satu tempat.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-700 dark:text-gray-300 sm:text-lg">
              Kamus Jepang, latihan soal, dan game teka-teki silang dalam satu tempat untuk pembelajar Indonesia, dari huruf Kana hingga persiapan JLPT.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/practice" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-blue px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
                Mulai Belajar <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/kanji" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-foreground transition hover:border-accent-green hover:text-accent-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green">
                <BookOpen aria-hidden="true" className="h-4 w-4" /> Coba Kamus
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-sm sm:block lg:justify-self-end">
            <div className="absolute -left-7 top-8 font-japanese text-5xl font-black text-accent-gold/30">学</div>
            <div className="absolute -right-4 bottom-8 font-japanese text-5xl font-black text-accent-green/30">語</div>
            <div className="grid aspect-square grid-cols-3 gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-xl sm:gap-3 sm:p-6">
              {[
                ['日', 'bg-accent-blue/10 text-accent-blue'], ['本', 'bg-accent-green/10 text-accent-green'], ['語', 'bg-accent-gold/10 text-accent-gold'],
                ['学', 'bg-accent-green/10 text-accent-green'], ['習', 'bg-accent-blue/10 text-accent-blue'], ['文', 'bg-accent-green/10 text-accent-green'],
                ['字', 'bg-accent-gold/10 text-accent-gold'], ['典', 'bg-accent-green/10 text-accent-green'], ['!', 'bg-accent-blue/10 text-accent-blue'],
              ].map(([character, color]) => (
                <span key={character} className={`flex items-center justify-center rounded-xl font-japanese text-3xl font-black sm:text-4xl ${color}`}>{character}</span>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-gray-500">漢字 · 語彙 · 文法</p>
          </div>
        </section>

        <section aria-labelledby="mission-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
            <div>
              <p className="text-xs font-bold uppercase text-accent-green">Misi kami</p>
              <h2 id="mission-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Kenapa JBook Ada</h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                Belajar bahasa Jepang sering berarti berpindah antara kamus, materi tata bahasa, dan latihan yang tersebar. Bagi pembelajar Indonesia, penjelasan berbahasa Indonesia juga membantu memahami materi tanpa selalu bergantung pada terjemahan bahasa lain.
              </p>
              <p>
                JBook menyatukan referensi Kanji, Kotoba, Bunpo, dan Kana dengan latihan soal serta game teka-teki silang. Untuk belajar berkelanjutan, tersedia koleksi kosakata dengan review berkala dan dashboard yang merangkum aktivitas latihan.
              </p>
              <p>
                Tujuannya sederhana: membantu kamu memilih materi, berlatih, dan melanjutkan belajar dengan alur yang terasa lebih terhubung.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="features-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="mb-7 flex flex-col gap-2 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-accent-blue">Ruang belajar</p>
              <h2 id="features-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Apa yang Bisa Kamu Lakukan di JBook</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">Pilih satu materi untuk mulai, atau gabungkan beberapa cara belajar.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, href, label, tone }) => (
              <article key={title} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                <Link href={href} className="mt-4 inline-flex min-h-8 items-center gap-1 text-sm font-bold text-accent-blue transition hover:gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
                  {label} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="audience-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-bold uppercase text-accent-gold">Belajar sesuai kebutuhan</p>
            <h2 id="audience-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Untuk Siapa JBook?</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {learners.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className="flex gap-4 border-t-2 border-accent-blue/30 py-5 sm:py-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-accent-blue">0{index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="sources-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
            <div>
              <p className="text-xs font-bold uppercase text-accent-green">Transparansi materi</p>
              <h2 id="sources-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Sumber Data</h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              <p>
                Katalog kurikulum JBook mencatat Minna no Nihongo Shokyu I untuk N5 dan Shokyu II untuk N4. Namun, materi lama tidak otomatis dikaitkan ke buku tertentu karena asalnya tidak dapat dipastikan dari data yang tersedia.
              </p>
              <p>
                Materi Kanji, kosakata, dan tata bahasa disusun dari data pembelajaran yang tersedia di JBook serta referensi yang dicatat pada katalog. Rincian sumber dan pemetaan dapat berbeda menurut materi. Jika menemukan ketidakakuratan, kamu dapat mengirim saran materi.
              </p>
              <p className="text-xs text-gray-500">JBook tidak menyatakan seluruh materi berasal dari satu buku atau sumber tertentu.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="contact-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase text-accent-blue">Masukanmu berarti</p>
              <h2 id="contact-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Hubungi Kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Belum ada alamat email kontak umum yang dipublikasikan di aplikasi. Untuk mengusulkan koreksi atau tambahan materi Kanji, gunakan formulir saran Kanji.
              </p>
            </div>
            <Link href="/kanji/add" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold transition hover:border-accent-blue hover:text-accent-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue sm:self-center">
              <Lightbulb aria-hidden="true" className="h-4 w-4" /> Kirim Saran Kanji
            </Link>
          </div>
        </section>

        <section aria-labelledby="legal-title" className="border-t border-[var(--border-color)] py-12 sm:py-16">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase text-accent-gold">Informasi akun</p>
            <h2 id="legal-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Privasi &amp; Ketentuan</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/privacy-security" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold transition hover:border-accent-blue hover:text-accent-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Kebijakan Privasi &amp; Keamanan <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm text-gray-500" aria-label="Syarat dan ketentuan segera hadir">
              Syarat &amp; Ketentuan <span className="rounded-full bg-accent-gold/10 px-2 py-0.5 text-xs font-bold text-accent-gold">Segera hadir</span>
            </span>
          </div>
        </section>

        <section aria-labelledby="closing-cta-title" className="relative isolate mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-accent-blue to-accent-green px-5 py-10 text-white sm:mb-16 sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-3 -top-8 -z-10 select-none font-japanese text-8xl font-black text-white/10 sm:right-5 sm:top-0 sm:text-9xl">学習</div>
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase text-white/80">Langkah berikutnya</p>
            <h2 id="closing-cta-title" className="mt-2 text-3xl font-japanese font-black sm:text-4xl">Siap Mulai Belajar?</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              Pilih materi yang ingin kamu kuasai, lalu mulai berlatih dengan ritmemu sendiri.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-accent-blue transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Daftar Gratis <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/tts" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Coba Tanpa Daftar <Gamepad2 aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
