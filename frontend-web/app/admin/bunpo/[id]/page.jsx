'use client';

import { useParams } from 'next/navigation';
import AdminResourceDetail from '@/components/admin/AdminResourceDetail';

const resource = { route: 'bunpo', endpoint: 'bunpo', label: 'Bunpo', title: item => item.title };
const fields = [
    { key: 'title', label: 'Judul' }, { key: 'structure', label: 'Struktur' }, { key: 'explanation', label: 'Penjelasan' },
    { key: 'jlpt_level', label: 'Level JLPT', render: item => `N${item.jlpt_level}` }, { key: 'chapter', label: 'Bab' },
    { key: 'sentences', label: 'Contoh kalimat', render: item => (item.sentences || []).map(sentence => `${sentence.jp || ''}\n${sentence.id || ''}`.trim()).join('\n\n') || '—' },
];

export default function BunpoDetailPage() {
    const { id } = useParams();
    return <AdminResourceDetail resource={resource} id={id} fields={fields} />;
}
