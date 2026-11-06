'use client';

import { useParams } from 'next/navigation';
import AdminResourceDetail from '@/components/admin/AdminResourceDetail';

const resource = { route: 'kanji', endpoint: 'kanji', label: 'Kanji', title: item => `${item.character} ${item.meaning || ''}`.trim() };
const fields = [
    { key: 'character', label: 'Karakter' }, { key: 'meaning', label: 'Arti' },
    { key: 'onyomi', label: 'Onyomi', render: item => Array.isArray(item.onyomi) ? item.onyomi.join(', ') : item.onyomi },
    { key: 'kunyomi', label: 'Kunyomi', render: item => Array.isArray(item.kunyomi) ? item.kunyomi.join(', ') : item.kunyomi },
    { key: 'strokes', label: 'Jumlah goresan' }, { key: 'jlpt_level', label: 'Level JLPT', render: item => `N${item.jlpt_level}` },
    { key: 'radical', label: 'Radikal' }, { key: 'word_type', label: 'Tipe kata' },
];

export default function KanjiDetailPage() {
    const { id } = useParams();
    return <AdminResourceDetail resource={resource} id={id} fields={fields} />;
}