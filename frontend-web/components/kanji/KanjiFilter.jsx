'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useTheme } from '@/context/ThemeContext';


const RADICALS_BY_STROKES = [
    {
        strokes: 1,
        radicals: [
            { char: '一', name: 'One' }, { char: '丨', name: 'Line' }, { char: '丶', name: 'Dot' },
            { char: '丿', name: 'Slash' }, { char: '乙', name: 'Second' }, { char: '亅', name: 'Hook' }
        ]
    },
    {
        strokes: 2,
        radicals: [
            { char: '二', name: 'Two' }, { char: '亠', name: 'Lid' }, { char: '人', name: 'Person' },
            { char: '亻', name: 'Person (side)' }, { char: '儿', name: 'Legs' }, { char: '入', name: 'Enter' },
            { char: '八', name: 'Eight' }, { char: '冂', name: 'Down box' }, { char: '冖', name: 'Cover' },
            { char: '冫', name: 'Ice' }, { char: '几', name: 'Table' }, { char: '凵', name: 'Container' },
            { char: '刀', name: 'Knife' }, { char: '刂', name: 'Knife (side)' }, { char: '力', name: 'Power' },
            { char: '勹', name: 'Wrap' }, { char: '匕', name: 'Spoon' }, { char: '匚', name: 'Box' },
            { char: '十', name: 'Ten' }, { char: '卜', name: 'Divination' }, { char: '卩', name: 'Seal' },
            { char: '厂', name: 'Cliff' }, { char: '厶', name: 'Private' }, { char: '又', name: 'Again' }
        ]
    },
    {
        strokes: 3,
        radicals: [
            { char: '口', name: 'Mouth' }, { char: '囗', name: 'Enclosure' }, { char: '土', name: 'Earth' },
            { char: '士', name: 'Scholar' }, { char: '夂', name: 'Winter' }, { char: '夕', name: 'Evening' },
            { char: '大', name: 'Big' }, { char: '女', name: 'Woman' }, { char: '子', name: 'Child' },
            { char: '宀', name: 'Roof' }, { char: '寸', name: 'Inch' }, { char: '小', name: 'Small' },
            { char: '⺌', name: 'Small (top)' }, { char: '尢', name: 'Lame' }, { char: '尸', name: 'Corpse' },
            { char: '屮', name: 'Sprout' }, { char: '山', name: 'Mountain' }, { char: '川', name: 'River' },
            { char: '工', name: 'Work' }, { char: '己', name: 'Self' }, { char: '巾', name: 'Towel' },
            { char: '干', name: 'Dry' }, { char: '幺', name: 'Short thread' }, { char: '广', name: 'Dotted cliff' },
            { char: '廴', name: 'Long stride' }, { char: '廾', name: 'Two hands' }, { char: '弋', name: 'Shoot' },
            { char: '弓', name: 'Bow' }, { char: '彐', name: 'Snout' }, { char: '彡', name: 'Bristle' },
            { char: '彳', name: 'Step' }, { char: '⺡', name: 'Water (side)' }, { char: '忄', name: 'Heart (side)' },
            { char: '扌', name: 'Hand (side)' }, { char: '犭', name: 'Dog (side)' }, { char: '艹', name: 'Grass (top)' },
            { char: '辶', name: 'Road' }, { char: '门', name: 'Gate' }, { char: '飞', name: 'Fly' },
            { char: '饣', name: 'Food' }, { char: '马', name: 'Horse' }
        ]
    },
    {
        strokes: 4,
        radicals: [
            { char: '心', name: 'Heart' }, { char: '戈', name: 'Halberd' }, { char: '戶', name: 'Door' },
            { char: '手', name: 'Hand' }, { char: '支', name: 'Branch' }, { char: '攴', name: 'Rap' },
            { char: '文', name: 'Script' }, { char: '斗', name: 'Dipper' }, { char: '斤', name: 'Axe' },
            { char: '方', name: 'Square' }, { char: '无', name: 'Not' }, { char: '日', name: 'Sun' },
            { char: '曰', name: 'Say' }, { char: '月', name: 'Moon' }, { char: '木', name: 'Tree' },
            { char: '欠', name: 'Lack' }, { char: '止', name: 'Stop' }, { char: '歹', name: 'Death' },
            { char: '殳', name: 'Weapon' }, { char: '毋', name: 'Do not' }, { char: '比', name: 'Compare' },
            { char: '毛', name: 'Fur' }, { char: '氏', name: 'Clan' }, { char: '气', name: 'Steam' },
            { char: '水', name: 'Water' }, { char: '火', name: 'Fire' }, { char: '灬', name: 'Fire (bottom)' },
            { char: '爪', name: 'Claw' }, { char: '父', name: 'Father' }, { char: '爻', name: 'Double x' },
            { char: '爿', name: 'Split wood' }, { char: '片', name: 'Slice' }, { char: '牙', name: 'Fang' },
            { char: '牛', name: 'Cow' }, { char: '犬', name: 'Dog' }, { char: '王', name: 'King' }
        ]
    },
    {
        strokes: 5,
        radicals: [
            { char: '玄', name: 'Dark' }, { char: '玉', name: 'Jade' }, { char: '瓜', name: 'Melon' },
            { char: '瓦', name: 'Tile' }, { char: '甘', name: 'Sweet' }, { char: '生', name: 'Life' },
            { char: '用', name: 'Use' }, { char: '田', name: 'Field' }, { char: '疋', name: 'Bolt of cloth' },
            { char: '疒', name: 'Sickness' }, { char: '癶', name: 'Dotted tent' }, { char: '白', name: 'White' },
            { char: '皮', name: 'Skin' }, { char: '皿', name: 'Dish' }, { char: '目', name: 'Eye' },
            { char: '矛', name: 'Spear' }, { char: '矢', name: 'Arrow' }, { char: '石', name: 'Stone' },
            { char: '示', name: 'Spirit' }, { char: '礻', name: 'Spirit (side)' }, { char: '禸', name: 'Track' },
            { char: '禾', name: 'Grain' }, { char: '穴', name: 'Cave' }, { char: '立', name: 'Stand' }
        ]
    },
    {
        strokes: 6,
        radicals: [
            { char: '竹', name: 'Bamboo' }, { char: '米', name: 'Rice' }, { char: '糸', name: 'Silk' },
            { char: '缶', name: 'Jar' }, { char: '网', name: 'Net' }, { char: '羊', name: 'Sheep' },
            { char: '羽', name: 'Feather' }, { char: '老', name: 'Old' }, { char: '而', name: 'And' },
            { char: '耒', name: 'Plow' }, { char: '耳', name: 'Ear' }, { char: '聿', name: 'Brush' },
            { char: '肉', name: 'Meat' }, { char: '臣', name: 'Minister' }, { char: '自', name: 'Self' },
            { char: '至', name: 'Arrive' }, { char: '臼', name: 'Mortar' }, { char: '舌', name: 'Tongue' },
            { char: '舛', name: 'Oppose' }, { char: '舟', name: 'Boat' }, { char: '艮', name: 'Stopping' },
            { char: '色', name: 'Color' }, { char: '艸', name: 'Grass' }, { char: '虍', name: 'Tiger' },
            { char: '虫', name: 'Insect' }, { char: '血', name: 'Blood' }, { char: '行', name: 'Walk' },
            { char: '衣', name: 'Clothes' }, { char: '衤', name: 'Clothes (side)' }, { char: '西', name: 'West' }
        ]
    },
    {
        strokes: '7+',
        radicals: [
            { char: '見', name: 'See' }, { char: '角', name: 'Horn' }, { char: '言', name: 'Speech' },
            { char: '谷', name: 'Valley' }, { char: '豆', name: 'Bean' }, { char: '豕', name: 'Pig' },
            { char: '豸', name: 'Badger' }, { char: '貝', name: 'Shell' }, { char: '赤', name: 'Red' },
            { char: '走', name: 'Run' }, { char: '足', name: 'Foot' }, { char: '身', name: 'Body' },
            { char: '車', name: 'Car' }, { char: '辛', name: 'Spicy' }, { char: '辰', name: 'Dragon' },
            { char: '辵', name: 'Walk' }, { char: '邑', name: 'City' }, { char: '酉', name: 'Wine' },
            { char: '釆', name: 'Divide' }, { char: '里', name: 'Village' }, { char: '金', name: 'Gold' },
            { char: '長', name: 'Long' }, { char: '門', name: 'Gate' }, { char: '阜', name: 'Mound' },
            { char: '隶', name: 'Slave' }, { char: '隹', name: 'Short-tailed bird' }, { char: '雨', name: 'Rain' },
            { char: '青', name: 'Blue' }, { char: '非', name: 'Wrong' }, { char: '面', name: 'Face' },
            { char: '革', name: 'Leather' }, { char: '音', name: 'Sound' }, { char: '頁', name: 'Leaf' },
            { char: '風', name: 'Wind' }, { char: '飛', name: 'Fly' }, { char: '食', name: 'Eat' },
            { char: '首', name: 'Head' }, { char: '香', name: 'Fragrant' }, { char: '馬', name: 'Horse' },
            { char: '骨', name: 'Bone' }, { char: '高', name: 'High' }, { char: '髟', name: 'Hair' },
            { char: '鬥', name: 'Fight' }, { char: '鬯', name: 'Sacrificial wine' }, { char: '鬲', name: 'Cauldron' },
            { char: '鬼', name: 'Ghost' }, { char: '魚', name: 'Fish' }, { char: '鳥', name: 'Bird' },
            { char: '鹵', name: 'Salt' }, { char: '鹿', name: 'Deer' }, { char: '麥', name: 'Wheat' },
            { char: '麻', name: 'Hemp' }, { char: '黃', name: 'Yellow' }, { char: '黍', name: 'Millet' },
            { char: '黑', name: 'Black' }, { char: '黹', name: 'Embroidery' }, { char: '黽', name: 'Frog' },
            { char: '鼎', name: 'Tripod' }, { char: '鼓', name: 'Drum' }, { char: '鼠', name: 'Rat' },
            { char: '鼻', name: 'Nose' }, { char: '齊', name: 'Even' }, { char: '齒', name: 'Tooth' },
            { char: '龍', name: 'Dragon' }, { char: '龜', name: 'Turtle' }, { char: '龠', name: 'Flute' }
        ]
    }
];

function FilterContent() {
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params

    const initialSearch = searchParams.get('search') || '';
    const initialRadical = searchParams.get('radical') || '';
    const initialLevels = searchParams.get('level')?.split(',').filter(Boolean) || [];

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedRadical, setSelectedRadical] = useState(initialRadical);
    const [selectedLevels, setSelectedLevels] = useState(initialLevels);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [showRadicals, setShowRadicals] = useState(false);
    
    // Sync state with URL changes (e.g. back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
        setSelectedRadical(searchParams.get('radical') || '');
        setSelectedLevels(searchParams.get('level')?.split(',').filter(Boolean) || []);
    }, [searchParams]);

    // Debounce search term to avoid too many URL updates
    const [debouncedSearch] = useDebounce(searchTerm, 500);

    // Open group if selected radical is inside it initially
    useEffect(() => {
        if (initialRadical) {
            setShowRadicals(true);
            const group = RADICALS_BY_STROKES.find(g => g.radicals.some(r => r.char === initialRadical));
            if (group) {
                setExpandedGroup(group.strokes);
            }
        }
    }, []);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }

        if (selectedRadical) {
            params.set('radical', selectedRadical);
        } else {
            params.delete('radical');
        }

        if (selectedLevels.length) {
            params.set('level', selectedLevels.join(','));
        } else {
            params.delete('level');
        }

        // Reset page when filter changes, IF search/radical/level changed
        // We need to compare with current params to avoid loop if effect runs on mount
        const currentSearch = searchParams.get('search') || '';
        const currentRadical = searchParams.get('radical') || '';
        const currentLevel = searchParams.get('level') || '';

        if (debouncedSearch !== currentSearch || selectedRadical !== currentRadical || selectedLevels.join(',') !== currentLevel) {
            params.delete('page'); // Reset pagination
            router.push(`/kanji?${params.toString()}`, { scroll: false });
        }

    }, [debouncedSearch, selectedRadical, selectedLevels, router, searchParams]);

    const handleRadicalClick = (rad) => {
        if (selectedRadical === rad) {
            setSelectedRadical('');
        } else {
            setSelectedRadical(rad);
        }
        setShowRadicals(false);
    };

    const handleClearRadical = (e) => {
        e.stopPropagation();
        setSelectedRadical('');
        setShowRadicals(false);
    };

    const toggleGroup = (strokes) => {
        if (expandedGroup === strokes) {
            setExpandedGroup(null);
        } else {
            setExpandedGroup(strokes);
        }
    };

    const handleLevelClick = (level) => {
        const stringLevel = level.toString();
        if (selectedLevels.includes(stringLevel)) {
            setSelectedLevels(selectedLevels.filter(l => l !== stringLevel));
        } else {
            setSelectedLevels([...selectedLevels, stringLevel]);
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl shadow-accent-blue/5 transition-all duration-300 w-full relative z-30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-start mb-4">
                {/* Search Kanji */}
                <div className="sm:col-span-2 lg:col-span-7">
                    <label className="block font-black mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <span>🔍</span> Cari Kanji
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Masukan bacaan (romaji/hiragana) atau arti..."
                            className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all group-hover:border-accent-blue/30 rounded-2xl text-sm font-semibold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 px-1">Contoh: "mizu", "みず", "air"</p>
                </div>

                {/* Level Filter: 3-2 Grid */}
                <div className="sm:col-span-2 lg:col-span-5">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Filter Level JLPT
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 w-full">
                        {[5, 4, 3, 2, 1].map((level) => {
                            const isSelected = selectedLevels.includes(level.toString());
                            const spanClass = [5, 4, 3].includes(level) ? 'col-span-2' : 'col-span-3';
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => handleLevelClick(level)}
                                    className={`${spanClass} py-2 rounded-xl border font-black text-xs transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-accent-blue to-accent-green text-white border-transparent shadow-md shadow-accent-blue/20 scale-[1.02]'
                                            : 'bg-[var(--background)] text-gray-600 dark:text-gray-400 border-[var(--border-color)] hover:border-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/5'
                                    }`}
                                >
                                    N{level}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Radicals Dropdown Bar */}
            <div className="border-t border-[var(--border-color)] pt-4 relative">
                <div className="flex items-center justify-between w-full">
                    <button
                        type="button"
                        onClick={() => setShowRadicals(!showRadicals)}
                        className="flex items-center gap-3 text-left group cursor-pointer py-1"
                    >
                        <span className="font-black uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-accent-blue transition-colors flex items-center gap-2">
                            <span>部首</span> Filter berdasarkan Radikal
                        </span>

                        {selectedRadical ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-accent-blue/20 to-accent-green/20 border border-accent-blue/30 text-accent-blue font-bold text-xs">
                                <span className="font-japanese text-sm font-black">{selectedRadical}</span>
                                <button
                                    type="button"
                                    onClick={handleClearRadical}
                                    className="w-4 h-4 rounded-full flex items-center justify-center bg-accent-blue/20 hover:bg-accent-blue hover:text-white transition-all ml-0.5 text-[10px] font-black"
                                    title="Hapus Filter Radikal"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--background)] border border-[var(--border-color)] text-gray-400">
                                Semua
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowRadicals(!showRadicals)}
                        className="text-gray-400 hover:text-accent-blue text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <span className="text-[10px] tracking-widest uppercase">{showRadicals ? 'Tutup' : 'Pilih Radikal'}</span>
                        <span className="text-xs transition-transform duration-200">{showRadicals ? '▲' : '▼'}</span>
                    </button>
                </div>

                {showRadicals && (
                    <>
                        {/* Transparent click-outside overlay (NO screen blur) */}
                        <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setShowRadicals(false)} 
                        />

                        {/* Floating Dropdown that OVERLAYS / MENIMPA Kanji cards below */}
                        <div className="absolute top-full left-0 right-0 mt-3 z-50 p-6 bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-2xl shadow-black/40 dark:shadow-black/70 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-200 max-h-[65vh] overflow-y-auto">
                            
                            {/* Dropdown Header Bar */}
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-green"></span>
                                    <h3 className="font-black text-xs uppercase tracking-widest text-[var(--foreground)]">
                                        Pilih Radikal (部首)
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedRadical && (
                                        <button
                                            type="button"
                                            onClick={handleClearRadical}
                                            className="px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="font-japanese text-sm">{selectedRadical}</span>
                                            <span>✕ Hapus</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowRadicals(false)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--background)] border border-[var(--border-color)] text-gray-400 hover:text-red-500 hover:border-red-400 transition-all cursor-pointer text-xs font-black"
                                        title="Tutup Dropdown"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Stroke Groups List */}
                            <div className="space-y-3">
                                {RADICALS_BY_STROKES.map((group) => {
                                    const isExpanded = expandedGroup === group.strokes;
                                    const hasSelected = group.radicals.some(r => r.char === selectedRadical);

                                    return (
                                        <div key={group.strokes} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                                            hasSelected 
                                                ? 'border-accent-blue/50 shadow-sm' 
                                                : 'border-[var(--border-color)]'
                                        }`}>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group.strokes)}
                                                className={`w-full flex items-center justify-between px-5 py-3 transition-all cursor-pointer ${
                                                    isExpanded || hasSelected 
                                                        ? (theme === 'dark' ? 'bg-accent-blue/15' : 'bg-blue-50/70') 
                                                        : (theme === 'dark' ? 'bg-[var(--background)]/60 hover:bg-[var(--background)]' : 'bg-gray-50/70 hover:bg-gray-100/70')
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`font-black text-xs uppercase tracking-wider ${hasSelected ? 'text-accent-blue' : 'text-[var(--foreground)]'}`}>
                                                        {group.strokes} Coretan
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-[var(--card-bg)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                                                        {group.radicals.length}
                                                    </span>
                                                    {hasSelected && (
                                                        <span className="text-[10px] font-black text-accent-blue bg-accent-blue/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            Terpilih
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-400 text-xs font-black transition-transform duration-200">
                                                    {isExpanded ? '▲' : '▼'}
                                                </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
                                                    <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                                                        {group.radicals.map((rad, idx) => {
                                                            const isSelected = selectedRadical === rad.char;
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleRadicalClick(rad.char)}
                                                                    className={`h-10 flex items-center justify-center font-japanese text-xl border rounded-xl transition-all duration-200 cursor-pointer relative ${
                                                                        isSelected
                                                                            ? 'bg-gradient-to-br from-accent-blue to-accent-green border-transparent text-white font-black shadow-lg shadow-accent-blue/30 scale-110 z-10'
                                                                            : 'bg-[var(--background)] border-[var(--border-color)] text-[var(--foreground)] hover:border-accent-blue/50 hover:text-accent-blue hover:scale-105 hover:bg-accent-blue/5'
                                                                    }`}
                                                                    title={`${rad.char} - ${rad.name}`}
                                                                >
                                                                    <span>{rad.char}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function KanjiFilter() {
    return (
        <Suspense fallback={<div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] w-full h-48 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
