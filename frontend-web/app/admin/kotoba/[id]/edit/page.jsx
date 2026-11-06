import { use } from 'react';
import KotobaForm from '@/components/admin/forms/KotobaForm';

export default function EditKotobaPage({ params }) {
    const { id } = use(params);
    return <KotobaForm id={id} />;
}