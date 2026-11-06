'use client';

import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function AdminConfirmDialog({ open, onCancel, onConfirm, itemLabel = 'data ini', busy = false }) {
    return <ConfirmationModal isOpen={open} onClose={onCancel} onConfirm={onConfirm} title="Hapus data?" message={`Tindakan ini akan menghapus ${itemLabel} secara permanen.`} confirmText={busy ? 'Menghapus...' : 'Hapus'} cancelText="Batal" />;
}