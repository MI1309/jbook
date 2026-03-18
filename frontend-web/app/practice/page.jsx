'use client';

import PracticeConfig from '@/components/PracticeConfig';

export default function PracticePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900 border-b-4 border-red-500 inline-block pb-2">
                Latihan & Analitik
            </h1>

            {/* Configuration Section */}
            <div className="mb-12">
                <PracticeConfig />
            </div>
        </div>
    );
}
