import Link from 'next/link';
import { ArrowLeft, Database, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'Data yang kami gunakan',
    text: 'JBook menggunakan data akun seperti nama pengguna dan email untuk autentikasi, sinkronisasi progres, serta pengalaman belajar yang lebih personal. Data materi belajar digunakan untuk menyediakan fitur Kanji, Kotoba, Bunpo, dan latihan.'
  },
  {
    icon: LockKeyhole,
    title: 'Perlindungan akun',
    text: 'Kredensial akun diproses melalui sistem autentikasi aplikasi. Jangan membagikan password atau token sesi kepada siapa pun. Gunakan password yang unik dan segera ubah jika merasa akun tidak aman.'
  },
  {
    icon: ShieldCheck,
    title: 'Penyimpanan offline',
    text: 'Saat fitur offline digunakan, sebagian materi belajar dapat disimpan di perangkat melalui penyimpanan lokal browser. Data lokal ini dapat dihapus dengan membersihkan data situs atau melalui pengaturan perangkat.'
  },
  {
    icon: UserRoundCheck,
    title: 'Kontrol pengguna',
    text: 'Pengguna dapat keluar dari akun, menghapus progres latihan melalui fitur yang tersedia, dan menghubungi tim JBook untuk pertanyaan atau permintaan terkait data akun.'
  }
];

export default function PrivacySecurityPage() {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] w-full overflow-x-hidden washi-texture bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 pb-16">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-accent-blue sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>

        <header className="mb-8 max-w-2xl sm:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-accent-blue">
            <ShieldCheck className="h-3.5 w-3.5" />
            Kepercayaan dan perlindungan
          </div>
          <h1 className="text-3xl font-black tracking-tight text-accent-blue sm:text-4xl">Privasi & Keamanan</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
            Ringkasan cara JBook menggunakan, menyimpan, dan membantu melindungi data saat kamu belajar.
          </p>
        </header>

        <main className="space-y-4 sm:space-y-5">
          {sections.map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="flex gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm sm:gap-5 sm:rounded-3xl sm:p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black sm:text-lg">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{text}</p>
              </div>
            </section>
          ))}
        </main>

        <p className="mt-8 text-xs leading-relaxed text-gray-500 sm:mt-10">
          Kebijakan ini dapat diperbarui ketika fitur atau cara kerja aplikasi berubah. Dengan menggunakan JBook, kamu menyetujui penggunaan data sebagaimana dijelaskan di halaman ini.
        </p>
      </div>
    </div>
  );
}
