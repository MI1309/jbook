import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BookOpen, Database, EyeOff, Fingerprint, KeyRound, LockKeyhole, MapPin, ShieldCheck, UserRoundCheck } from 'lucide-react';

export const metadata = {
  title: 'Kebijakan Privasi & Keamanan',
  description: 'Informasi tentang data akun, perlindungan, dan kontrol privasi di JBook.',
};

const sections = [
  {
    id: 'data-yang-digunakan',
    icon: Database,
    title: 'Data yang kami gunakan',
    paragraphs: [
      'JBook menggunakan data akun seperti nama pengguna dan email untuk autentikasi, sinkronisasi progres, serta pengalaman belajar yang lebih personal.',
      'Data materi belajar digunakan untuk menyediakan fitur Kanji, Kotoba, Bunpo, dan latihan.',
    ],
  },
  {
    id: 'perlindungan-akun',
    icon: LockKeyhole,
    title: 'Perlindungan akun',
    paragraphs: [
      'Kredensial akun diproses melalui sistem autentikasi aplikasi. Jangan membagikan password atau token sesi kepada siapa pun.',
      'Gunakan password yang unik dan segera ubah jika merasa akun tidak aman.',
    ],
  },
  {
    id: 'perlindungan-email',
    icon: KeyRound,
    title: 'Perlindungan alamat email',
    paragraphs: [
      'Alamat email asli dienkripsi sebelum disimpan. Database memakai alamat pengganti dan indeks HMAC berkunci untuk pencarian akun; kunci enkripsi disimpan terpisah dari database.',
      'Backend hanya mendekripsi alamat saat diperlukan, misalnya untuk mengirim tautan reset password.',
    ],
  },
  {
    id: 'email-di-aplikasi',
    icon: EyeOff,
    title: 'Email di aplikasi',
    paragraphs: [
      'API aplikasi hanya mengirim email tersamarkan, misalnya p***@contoh.com. Penyedia email tetap memproses alamat tujuan saat email reset dikirim.',
    ],
  },
  {
    id: 'detail-permintaan-reset',
    icon: MapPin,
    title: 'Informasi pada email reset password',
    paragraphs: [
      'Untuk membantu mengenali permintaan pemulihan akun, email reset password menyertakan alamat IP, waktu permintaan, dan perkiraan lokasi berupa kota, wilayah, serta negara jika tersedia.',
      'Untuk memperkirakan lokasi, alamat IP dikirim ke layanan geolokasi pihak ketiga. Hasilnya tidak selalu tepat, misalnya saat kamu menggunakan VPN atau proxy, dan dapat diproses sesuai kebijakan penyedia tersebut.',
    ],
  },
  {
    id: 'kontrol-pengguna',
    icon: UserRoundCheck,
    title: 'Kontrol pengguna',
    paragraphs: [
      'Pengguna dapat keluar dari akun, menghapus progres latihan melalui fitur yang tersedia, dan menghubungi tim JBook untuk pertanyaan atau permintaan terkait data akun.',
    ],
  },
  {
    id: 'kunci-dan-cadangan',
    icon: Fingerprint,
    title: 'Kunci dan cadangan data',
    paragraphs: [
      'Kunci enkripsi harus dijaga sebagai rahasia dan tidak boleh berubah tanpa proses re-enkripsi. Kehilangan kunci membuat alamat email tersimpan tidak dapat dipulihkan.',
      'Cadangan database lama yang dibuat sebelum perlindungan ini mungkin masih berisi email asli dan perlu diamankan atau dihapus sesuai kebijakan retensi.',
    ],
  }
];

export default function PrivacySecurityPage() {
  return (
    <div className="washi-texture min-h-[calc(100dvh-4rem)] bg-background px-4 py-8 text-foreground transition-colors duration-300 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-accent-blue sm:mb-10"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke beranda
        </Link>

        <header className="mb-9 max-w-3xl sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-green/25 bg-accent-green/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-accent-green">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Privasi &amp; Keamanan
          </div>
          <p className="font-japanese text-sm font-bold text-accent-blue" lang="ja">プライバシー</p>
          <h1 className="mt-2 font-japanese text-3xl font-black leading-tight sm:text-4xl">Kebijakan Privasi</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            Ketahui data yang digunakan JBook, cara akun dan alamat email dilindungi, serta kontrol yang tersedia untukmu.
          </p>
          <p className="mt-4 text-xs font-medium text-gray-500">Terakhir diperbarui: 6 November 2026</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <aside className="self-start lg:sticky lg:top-20">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-black">
                <BookOpen aria-hidden="true" className="h-4 w-4 text-accent-blue" />
                Daftar isi
              </h2>
              <nav aria-label="Daftar isi kebijakan privasi" className="mt-3">
                <ol className="space-y-1">
                  {sections.map(({ id, title }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="block rounded-md px-2 py-2 text-xs font-semibold leading-relaxed text-gray-600 transition-colors hover:bg-accent-blue/5 hover:text-accent-blue dark:text-gray-300"
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <Link
              href="/ketentuan"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"
            >
              Ketentuan penggunaan <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </aside>

          <article className="min-w-0 divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
            {sections.map(({ id, icon: Icon, title, paragraphs }, index) => (
              <section key={id} id={id} className="scroll-mt-24 py-6 sm:py-8">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-blue/20 bg-accent-blue/5 text-accent-blue">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Bagian {String(index + 1).padStart(2, '0')}</p>
                    <h2 className="mt-1 text-base font-black sm:text-lg">{title}</h2>
                    <div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </article>
        </div>

        <p className="mt-8 max-w-3xl border-t border-[var(--border-color)] pt-5 text-xs leading-relaxed text-gray-500 sm:mt-10">
          Kebijakan ini dapat diperbarui ketika fitur atau cara kerja aplikasi berubah. Dengan menggunakan JBook, kamu menyetujui penggunaan data sebagaimana dijelaskan di halaman ini.
        </p>
      </div>
    </div>
  );
}
