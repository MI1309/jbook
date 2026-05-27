'use client';

export default function SakuraBackground() {
    // Efek daun sakura gugur di seluruh halaman (fixed position)
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="sakura-petal w-3 h-3" style={{ top: '-10%', left: '5%', animation: 'sakura-fall 12s linear infinite', animationDelay: '0s' }}></div>
            <div className="sakura-petal w-2 h-4" style={{ top: '-10%', left: '35%', animation: 'sakura-fall 15s linear infinite', animationDelay: '3s' }}></div>
            <div className="sakura-petal w-4 h-3" style={{ top: '-10%', left: '70%', animation: 'sakura-fall 10s linear infinite', animationDelay: '6s' }}></div>
            <div className="sakura-petal w-3 h-2" style={{ top: '-10%', left: '88%', animation: 'sakura-fall 18s linear infinite', animationDelay: '1s' }}></div>
            <div className="sakura-petal w-2.5 h-3" style={{ top: '-10%', left: '55%', animation: 'sakura-fall 14s linear infinite', animationDelay: '4s' }}></div>
            
            {/* Tambahan kelopak agar lebih merata */}
            <div className="sakura-petal w-3 h-3" style={{ top: '-10%', left: '20%', animation: 'sakura-fall 16s linear infinite', animationDelay: '8s' }}></div>
            <div className="sakura-petal w-2 h-3" style={{ top: '-10%', left: '80%', animation: 'sakura-fall 13s linear infinite', animationDelay: '11s' }}></div>
        </div>
    );
}
