'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';


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
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params

    const initialSearch = searchParams.get('search') || '';
    const initialRadical = searchParams.get('radical') || '';
    const initialLevel = searchParams.get('level') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedRadical, setSelectedRadical] = useState(initialRadical);
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [showRadicals, setShowRadicals] = useState(false);

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

        if (selectedLevel) {
            params.set('level', selectedLevel);
        } else {
            params.delete('level');
        }

        // Reset page when filter changes, IF search/radical/level changed
        // We need to compare with current params to avoid loop if effect runs on mount
        const currentSearch = searchParams.get('search') || '';
        const currentRadical = searchParams.get('radical') || '';
        const currentLevel = searchParams.get('level') || '';

        if (debouncedSearch !== currentSearch || selectedRadical !== currentRadical || selectedLevel !== currentLevel) {
            params.delete('page'); // Reset pagination
            router.push(`/kanji?${params.toString()}`);
        }

    }, [debouncedSearch, selectedRadical, selectedLevel, router, searchParams]);

    const handleRadicalClick = (rad) => {
        if (selectedRadical === rad) {
            setSelectedRadical('');
        } else {
            setSelectedRadical(rad);
        }
    };

    const toggleGroup = (strokes) => {
        if (expandedGroup === strokes) {
            setExpandedGroup(null);
        } else {
            setExpandedGroup(strokes);
        }
    };

    const handleLevelClick = (level) => {
        if (selectedLevel === level.toString()) {
            setSelectedLevel('');
        } else {
            setSelectedLevel(level.toString());
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Cari Kanji</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Masukan bacaan (romaji/hiragana) atau arti..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contoh: "mizu", "みず", "air"</p>
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-2">Filter Level JLPT</label>
                    <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleLevelClick(level)}
                                className={`px-4 py-2 rounded-lg border transition-colors font-medium ${selectedLevel === level.toString()
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                N{level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <button
                    onClick={() => setShowRadicals(!showRadicals)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <span className="text-gray-700 font-bold">Filter berdasarkan Radikal</span>
                    <span className="text-gray-500 text-sm">{showRadicals ? 'Sembunyikan ▲' : 'Tampilkan ▼'}</span>
                </button>

                {showRadicals && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {RADICALS_BY_STROKES.map((group) => {
                            const isExpanded = expandedGroup === group.strokes;
                            const hasSelected = group.radicals.some(r => r.char === selectedRadical);

                            return (
                                <div key={group.strokes} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleGroup(group.strokes)}
                                        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors ${isExpanded || hasSelected ? 'bg-red-50' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <span className={`font-semibold text-sm ${hasSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                                {group.strokes} Coretan
                                            </span>
                                            {hasSelected && <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>}
                                        </div>
                                        <span className="text-gray-500 text-xs transform transition-transform duration-200">
                                            {isExpanded ? '▲' : '▼'}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 bg-white border-t border-gray-100">
                                            <div className="flex flex-wrap gap-2">
                                                {group.radicals.map((rad, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleRadicalClick(rad.char)}
                                                        className={`w-9 h-9 flex items-center justify-center text-lg border rounded transition-colors ${selectedRadical === rad.char
                                                            ? 'bg-red-100 border-red-500 text-red-700 font-bold shadow-sm'
                                                            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                                            }`}
                                                        title={rad.name}
                                                    >
                                                        {rad.char}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {selectedRadical && (
                            <button
                                onClick={() => setSelectedRadical('')}
                                className="mt-4 text-sm text-red-600 hover:underline flex items-center"
                            >
                                <span className="mr-1">✕</span> Hapus filter radikal
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanjiFilter() {
    return (
        <Suspense fallback={<div className="p-6 bg-white rounded-lg shadow-md mb-8 h-48 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
