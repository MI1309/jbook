import KotobaCategorySearch from '@/components/kotoba/KotobaCategorySearch';
import WordTypeBadge from '@/components/kotoba/WordTypeBadge';

export default function KotobaCategoryHeader({ category, count, initialSearch = '', initialLevel = '', initialSuggestions = [] }) {
    return (
        <header className="grid min-w-0 gap-6 border-b border-[var(--border-color)] pb-6 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)] lg:items-center lg:gap-10">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="font-japanese text-sm font-bold text-gray-600 dark:text-gray-300">{category.japanese}</span><WordTypeBadge type={category.wordType} /></div>
                <h1 className="mt-3 break-words font-japanese text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">{category.name}</h1>
                <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">{category.description}</p>
                <p className="mt-4 text-sm text-gray-500">{count.toLocaleString('id-ID')} kata</p>
            </div>
            <KotobaCategorySearch key={`${category.slug}:${initialSearch}:${initialLevel}`} category={category} initialSearch={initialSearch} initialLevel={initialLevel} initialSuggestions={initialSuggestions} />
        </header>
    );
}