import { notFound } from 'next/navigation';
import AdminExportPage from '../page';

const exportSources = ['kanji', 'bunpo', 'kotoba'];

export default async function AdminExportSourcePage({ params }) {
    const { source } = await params;
    if (!exportSources.includes(source)) notFound();

    return <AdminExportPage key={source} fixedSource={source} />;
}