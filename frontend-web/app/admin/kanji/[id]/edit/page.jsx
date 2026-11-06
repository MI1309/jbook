import { use } from 'react';
import KanjiForm from '@/components/admin/forms/KanjiForm';

export default function EditKanjiPage({ params }) {
    const { id } = use(params);
    return <KanjiForm id={id} />;
}