'use client';

import { useTheme } from '@/context/ThemeContext';

export default function MinnaProgressBadge({ book, chapter, completed = 0, total = 10 }) {
    const { theme, mounted } = useTheme();

    const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-white/5' : 'border-white/60');

    return (
        <div className={`p-4 rounded-2xl border ${borderStyle} ${cardBg} shadow-sm transition-all duration-300 hover:shadow-md`}>
            <div className="flex justify-between items-center mb-2">
                <div>
                    <span className={`block font-black text-sm ${textColor}`}>
                        Minna {book} — Bab {chapter}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${subTextColor}`}>
                        Latihan Pemahaman
                    </span>
                </div>
                <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                    {percentage}%
                </span>
            </div>

            {/* Progress bar */}
            <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            
            <div className="flex justify-between items-center mt-2 text-[10px] font-bold">
                <span className={subTextColor}>
                    {completed} dari {total} Soal Selesai
                </span>
                <span className={percentage >= 100 ? 'text-green-600 font-black' : subTextColor}>
                    {percentage >= 100 ? 'Selesai! 🎉' : 'Dalam Proses'}
                </span>
            </div>
        </div>
    );
}
