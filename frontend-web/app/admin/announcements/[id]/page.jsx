'use client';

import { useParams } from 'next/navigation';
import AdminResourceDetail from '@/components/admin/AdminResourceDetail';

const resource = { route: 'announcements', endpoint: 'announcements', label: 'Pengumuman', title: item => item.title };
const fields = [
    { key: 'title', label: 'Judul' }, { key: 'content', label: 'Konten' }, { key: 'type', label: 'Tipe' },
    { key: 'priority', label: 'Prioritas' }, { key: 'is_active', label: 'Status', render: item => item.is_active ? 'Aktif' : 'Nonaktif' },
    { key: 'show_as_popup', label: 'Popup', render: item => item.show_as_popup ? 'Ya' : 'Tidak' },
    { key: 'show_from', label: 'Tampil dari' }, { key: 'show_until', label: 'Tampil sampai' },
];

export default function AnnouncementDetailPage() {
    const { id } = useParams();
    return <AdminResourceDetail resource={resource} id={id} fields={fields} />;
}
