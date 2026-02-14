import Link from 'next/link';
import { getUserAnalytics } from '@/lib/api';
import PracticeConfig from '@/components/PracticeConfig';

export default async function PracticePage() {
    const analytics = await getUserAnalytics();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900 border-b-4 border-red-500 inline-block pb-2">
                Latihan & Analitik
            </h1>

            {/* Configuration Section */}
            <div className="mb-12">
                <PracticeConfig />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Stats Card */}
                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl grayscale group-hover:grayscale-0 transition-all duration-500 pointer-events-none">
                        📊
                    </div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-red-500">📈</span> Statistik Belajar
                    </h2>
                    <div className="grid grid-cols-2 gap-6 text-center relative z-10">
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                            <div className="text-4xl font-black text-red-600 mb-2">{analytics.total_attempts}</div>
                            <div className="text-sm font-bold text-red-800 uppercase tracking-wide">Total Percobaan</div>
                        </div>
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <div className="text-4xl font-black text-green-600 mb-2">{analytics.accuracy}%</div>
                            <div className="text-sm font-bold text-green-800 uppercase tracking-wide">Akurasi</div>
                        </div>
                    </div>
                </div>

                {/* Wrong Guesses Card */}
                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-red-500">🎯</span> Perlu Dilatih Lagi
                    </h2>
                    {analytics.wrong_stats.length > 0 ? (
                        <ul className="space-y-3">
                            {analytics.wrong_stats.map((stat, index) => (
                                <li key={index} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-200 transition-all cursor-default">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-serif font-medium text-gray-800 bg-gray-50 w-12 h-12 flex items-center justify-center rounded-lg">{stat.character}</span>
                                        <span className="text-sm text-red-600 font-bold bg-red-100 px-3 py-1 rounded-full">{stat.count}x Salah</span>
                                    </div>
                                    <Link href={`/kanji?search=${stat.character}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                        Pelajari <span>→</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                            <div className="text-6xl mb-4 opacity-20">✨</div>
                            <p className="italic">Belum ada data kesalahan. Hebat!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
