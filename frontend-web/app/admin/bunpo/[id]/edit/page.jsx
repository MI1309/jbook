import { use } from 'react';
import BunpoForm from '@/components/admin/forms/BunpoForm';

export default function EditBunpoPage({ params }) {
    const { id } = use(params);
    return <BunpoForm id={id} />;
}