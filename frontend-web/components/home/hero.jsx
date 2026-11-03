import Link from 'next/link';
import {
  ArrowRight,
  BookMarked,
  Gamepad2,
  ShieldCheck,
  Type,
  UsersRound,
} from 'lucide-react';

export const learners = [
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

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function AboutSections() {
  return (
    <div className="w-full max-w-5xl space-y-10 pb-8 text-left sm:space-y-12">      

      {/* Informasi legal */}
      <section aria-labelledby="legal-title" className="border-t border-[var(--border-color)] pt-8">
        <h2 id="legal-title" className="font-japanese text-2xl font-black sm:text-3xl">Privasi &amp; Ketentuan</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/privacy-security" className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold transition hover:border-accent-blue hover:text-accent-blue ${focusRing} focus-visible:outline-accent-blue`}>
            <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Kebijakan Privasi &amp; Keamanan
          </Link>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm text-gray-500" aria-label="Syarat dan ketentuan segera hadir">
            Syarat &amp; Ketentuan <span className="rounded-full bg-accent-gold/10 px-2 py-0.5 text-xs font-bold text-accent-gold">Segera hadir</span>
          </span>
        </div>
      </section>

      {/* CTA penutup */}
      <section aria-labelledby="closing-cta-title" className="relative isolate overflow-hidden rounded-xl bg-gradient-to-br from-accent-blue to-accent-green px-5 py-8 text-white sm:px-8 sm:py-10">
        <div aria-hidden="true" className="absolute -right-3 -top-8 -z-10 select-none font-japanese text-8xl font-black text-white/10 sm:right-5 sm:top-0 sm:text-9xl">学習</div>
        <div className="relative max-w-3xl">
          <h2 id="closing-cta-title" className="font-japanese text-2xl font-black sm:text-3xl">Siap Mulai Belajar?</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90">Pilih materi yang ingin kamu kuasai, lalu mulai berlatih dengan ritmemu sendiri.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-accent-blue transition hover:bg-white/90 ${focusRing} focus-visible:outline-white`}>
              Daftar Gratis <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/tts" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 ${focusRing} focus-visible:outline-white`}>
              Coba Tanpa Daftar <Gamepad2 aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}