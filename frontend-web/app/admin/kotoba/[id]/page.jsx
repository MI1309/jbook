'use client';

import { useParams } from 'next/navigation';
import AdminResourceDetail from '@/components/admin/AdminResourceDetail';

const resource = { route: 'kotoba', endpoint: 'vocab', label: 'Kotoba', title: item => `${item.word} (${item.reading || '—'})` };
const fields = [
    { key: 'word', label: 'Kata' }, { key: 'reading', label: 'Bacaan' }, { key: 'meaning', label: 'Arti' },
    { key: 'jlpt_level', label: 'Level JLPT', render: item => `N${item.jlpt_level}` }, { key: 'word_type', label: 'Tipe kata' },
    { key: 'examples', label: 'Contoh kalimat', render: item => (item.examples || []).map(example => `${example.sentence || ''} ${example.meaning || ''}`.trim()).join('\n') || '—' },
];

export default function KotobaDetailPage() {
    const { id } = useParams();
    return <AdminResourceDetail resource={resource} id={id} fields={fields} />;
}