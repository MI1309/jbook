import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BookOpen, Scale } from 'lucide-react';

export const metadata = {
    title: 'Ketentuan Penggunaan',
    description: 'Ketentuan penggunaan platform belajar bahasa Jepang JBook.',
};

const sections = [
    {
        id: 'tentang-jbook',
        title: '1. Tentang JBook',
        paragraphs: [
            'JBook menyediakan materi dan alat bantu belajar bahasa Jepang, termasuk kamus kanji, kosakata, tata bahasa, latihan, dan fitur pendukung belajar lainnya.',
            'Dengan mengakses atau menggunakan JBook, kamu setuju untuk menggunakan layanan ini sesuai ketentuan di halaman ini dan aturan yang berlaku.',
        ],
    },
    {
        id: 'penggunaan-layanan',
        title: '2. Penggunaan layanan',
        paragraphs: [
            'Gunakan JBook untuk belajar dan kegiatan lain yang sah. Jangan mengganggu layanan, mencoba mengakses sistem atau akun orang lain tanpa izin, atau menggunakan layanan dengan cara yang dapat merugikan pengguna lain.',
            'Fitur tertentu mungkin memerlukan akun. Kamu bertanggung jawab menjaga keamanan akses akunmu dan memastikan informasi yang diberikan tetap akurat.',
        ],
    },
    {
        id: 'materi-pembelajaran',
        title: '3. Materi pembelajaran',
        paragraphs: [
            'Materi JBook disediakan sebagai referensi belajar. Kami berupaya menjaga ketepatan dan kegunaannya, tetapi materi dapat memiliki kekurangan atau perbedaan dengan sumber dan konteks penggunaan lainnya.',
            'JBook bukan pengganti pengajaran profesional atau sumber resmi ujian. Periksa kembali informasi penting dengan sumber tepercaya sesuai kebutuhanmu.',
        ],
    },
    {
        id: 'hak-atas-konten',
        title: '4. Hak atas konten',
        paragraphs: [
            'Konten dan tampilan yang disediakan JBook dimiliki oleh JBook atau digunakan dengan izin, kecuali dinyatakan lain. Kamu boleh mengaksesnya untuk penggunaan pribadi dalam kegiatan belajar.',
            'Jangan menyalin, menerbitkan ulang, atau menggunakan materi JBook untuk tujuan komersial tanpa izin dari pemilik hak terkait.',
        ],
    },
    {
        id: 'ketersediaan-perubahan',
        title: '5. Ketersediaan dan perubahan',
        paragraphs: [
            'Kami dapat memperbarui, mengubah, menangguhkan, atau menghentikan bagian dari layanan untuk pemeliharaan maupun pengembangan. Kami juga dapat memperbarui ketentuan ini; versi terbaru akan ditampilkan di halaman ini.',
        ],
    },
    {
        id: 'kontak',
        title: '6. Kontak',
        paragraphs: [
            'Untuk pertanyaan atau masukan tentang ketentuan penggunaan, silakan hubungi tim JBook melalui kanal kontak resmi yang tersedia di situs.',
        ],
    },
];

export default function TermsPage() {
    return (
        <main className="washi-texture min-h-[calc(100dvh-4rem)] bg-background px-4 py-8 text-foreground transition-colors duration-300 sm:px-6 sm:py-12">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-accent-blue sm:mb-10"
                >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    Kembali ke beranda
                </Link>

                <header className="mb-9 max-w-3xl sm:mb-12">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-accent-blue">
                        <Scale aria-hidden="true" className="h-3.5 w-3.5" />
                        Informasi Penggunaan
                    </div>
                    <p className="font-japanese text-sm font-bold text-accent-blue" lang="ja">利用規約</p>
                    <h1 className="mt-2 font-japanese text-3xl font-black leading-tight sm:text-4xl">Ketentuan Penggunaan</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                        Ketentuan berikut menjelaskan penggunaan materi dan layanan JBook. Luangkan waktu untuk membacanya sebelum menggunakan fitur di platform ini.
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
                            <nav aria-label="Daftar isi ketentuan" className="mt-3">
                                <ol className="space-y-1">
                                    {sections.map(({ id, title }) => (
                                        <li key={id}>
                                            <a
                                                href={`#${id}`}
                                                className="block rounded-md px-2 py-2 text-xs font-semibold leading-relaxed text-gray-600 transition-colors hover:bg-accent-blue/5 hover:text-accent-blue dark:text-gray-300"
                                            >
                                                {title.replace(/^\d+\.\s*/, '')}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                        </div>
                        <Link
                            href="/privacy-security"
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"
                        >
                            Kebijakan privasi <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                    </aside>

                    <article className="min-w-0 divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
                        {sections.map(({ id, title, paragraphs }) => (
                            <section key={id} id={id} className="scroll-mt-24 py-6 sm:py-8">
                                <h2 className="text-base font-black sm:text-lg">{title}</h2>
                                <div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                                    {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                                </div>
                            </section>
                        ))}
                    </article>
                </div>
            </div>
        </main>
    );
}