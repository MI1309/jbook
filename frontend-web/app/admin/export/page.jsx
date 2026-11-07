'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import AppMessage from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { appToast as toast } from '@/components/common/AppMessage';
import {
    BookOpen,
    ArrowLeft,
    ArrowRight,
    FileJson,
    FileSpreadsheet,
    FileText,
    Languages,
    ListFilter,
    Rows3,
    Search,
    Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'jbook_admin_export_history';
const DEFAULT_FILTERS = {
    level: '',
    wordType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    questionType: '',
    strokesMin: '',
    strokesMax: '',
};

const SOURCE_OPTIONS = [
    {
        id: 'kotoba',
        label: 'Kotoba',
        description: 'Daftar kosakata + bacaan + arti',
        icon: FileText,
        endpoint: 'vocab',
        previewFields: ['word', 'reading', 'meaning', 'jlpt_level'],
        labels: ['Kata', 'Bacaan', 'Arti', 'Level'],
    },
    {
        id: 'kanji',
        label: 'Kanji',
        description: 'Karakter + onyomi + kunyomi + arti',
        icon: Languages,
        endpoint: 'kanji',
        previewFields: ['character', 'onyomi', 'kunyomi', 'meaning', 'jlpt_level'],
        labels: ['Karakter', 'Onyomi', 'Kunyomi', 'Arti', 'Level'],
    },
    {
        id: 'bunpo',
        label: 'Bunpo',
        description: 'Struktur grammar + penjelasan',
        icon: BookOpen,
        endpoint: 'bunpo',
        previewFields: ['title', 'structure', 'jlpt_level'],
        labels: ['Judul', 'Struktur', 'Level'],
    },
    {
        id: 'latihan',
        label: 'Latihan',
        description: 'Data latihan (belum tersedia)',
        icon: Rows3,
        endpoint: null,
        disabled: true,
        previewFields: [],
        labels: [],
    },
];

const FORMAT_OPTIONS = [
    { id: 'csv', label: 'CSV', description: 'CSV — ringan, cocok untuk Excel', icon: FileText },
    { id: 'json', label: 'JSON', description: 'JSON — untuk integrasi program', icon: FileJson },
    { id: 'xlsx', label: 'XLSX', description: 'XLSX — siap dibuka di Excel', icon: FileSpreadsheet },
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

function buildKanjiPdfHtml(rows, selectedLevel, searchQuery) {
    const entries = rows.map((item) => {
        const onyomi = Array.isArray(item.onyomi) ? item.onyomi.join(', ') : (item.onyomi ?? '—');
        const kunyomi = Array.isArray(item.kunyomi) ? item.kunyomi.join(', ') : (item.kunyomi ?? '—');
        const examples = Array.isArray(item.examples) ? item.examples : [];
        const exampleHtml = examples.length
            ? `<ul>${examples.map((example) => `<li><strong>${escapeHtml(example.word ?? '')}</strong> ${escapeHtml(example.reading ?? '')} — ${escapeHtml(example.meaning ?? '')}</li>`).join('')}</ul>`
            : '<p class="muted">Belum ada contoh kata.</p>';

        return `
            <article class="entry">
                <div class="header">
                    <span>JBook / Kanji</span>
                    <span>N${escapeHtml(item.jlpt_level ?? selectedLevel ?? '')}</span>
                </div>
                <div class="hero">
                    <div class="kanji">${escapeHtml(item.character ?? '—')}</div>
                    <div class="meta">
                        <h2>${escapeHtml(item.meaning ?? '—')}</h2>
                        <p><strong>Onyomi:</strong> ${escapeHtml(onyomi)}</p>
                        <p><strong>Kunyomi:</strong> ${escapeHtml(kunyomi)}</p>
                    </div>
                </div>
                <h3>Contoh</h3>
                ${exampleHtml}
            </article>
        `;
    }).join('');

    const title = selectedLevel ? `N${escapeHtml(selectedLevel)}` : 'Semua level';
    return `<!doctype html>
        <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>JBook Kanji PDF</title>
          <style>
            @page { size: A4; margin: 16mm; }
            body { font-family: Arial, sans-serif; color: #1f2937; background: #fff; margin: 0; }
            .wrap { max-width: 100%; }
            .cover { padding-bottom: 20px; border-bottom: 2px solid #d1d5db; margin-bottom: 20px; }
            .cover h1 { font-size: 26px; margin: 0 0 6px; }
            .cover p { margin: 0; color: #4b5563; }
            .entry { break-inside: avoid; border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 18px; }
            .header { display: flex; justify-content: space-between; color: #b91c1c; font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; }
            .hero { display: flex; gap: 18px; align-items: center; }
            .kanji { font-size: 72px; font-weight: 700; color: #b91c1c; min-width: 96px; text-align: center; }
            .meta h2 { margin: 0 0 6px; font-size: 22px; }
            .meta p { margin: 4px 0; }
            h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin: 14px 0 8px; }
            ul { padding-left: 18px; margin: 0; }
            li { margin-bottom: 6px; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="cover">
              <h1>JBook - Kanji ${title}</h1>
              <p>${rows.length} item • ${searchQuery ? `Cari: ${escapeHtml(searchQuery)}` : 'Semua data'}</p>
            </div>
            ${entries}
          </div>
        </body>
        </html>`;
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function parseArrayResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return [];
}

function normalizeRows(rows, source) {
    if (!rows.length) return [];
    return rows.map((row) => {
        const normalized = { ...row };
        if (source === 'kotoba') {
            normalized.word = normalized.word ?? normalized.kata ?? '—';
            normalized.reading = normalized.reading ?? normalized.bacaan ?? '—';
            normalized.meaning = normalized.meaning ?? normalized.arti ?? '—';
            normalized.jlpt_level = normalized.jlpt_level ?? normalized.level ?? '—';
        }
        if (source === 'kanji') {
            normalized.character = normalized.character ?? normalized.kanji ?? '—';
            normalized.onyomi = Array.isArray(normalized.onyomi) ? normalized.onyomi.join(', ') : normalized.onyomi ?? '—';
            normalized.kunyomi = Array.isArray(normalized.kunyomi) ? normalized.kunyomi.join(', ') : normalized.kunyomi ?? '—';
            normalized.meaning = normalized.meaning ?? normalized.arti ?? '—';
            normalized.jlpt_level = normalized.jlpt_level ?? normalized.level ?? '—';
        }
        if (source === 'bunpo') {
            normalized.title = normalized.title ?? normalized.judul ?? '—';
            normalized.structure = normalized.structure ?? normalized.struktur ?? '—';
            normalized.jlpt_level = normalized.jlpt_level ?? normalized.level ?? '—';
        }
        return normalized;
    });
}

function serializePreviewRows(rows, source) {
    if (!rows.length) return [];
    const fields = SOURCE_OPTIONS.find((item) => item.id === source)?.previewFields || [];
    return rows.slice(0, 10).map((row) => {
        const output = {};
        fields.forEach((field) => {
            const value = row?.[field];
            output[field] = Array.isArray(value) ? value.join(', ') : (value ?? '—');
        });
        return output;
    });
}

function buildCsvFromRows(rows, source) {
    if (!rows.length) return '';
    const fields = SOURCE_OPTIONS.find((item) => item.id === source)?.previewFields || [];
    const header = fields.map((field) => field.replace(/_/g, ' '));
    const values = rows.map((row) => fields.map((field) => {
        const value = row?.[field] ?? '';
        return String(value).replace(/"/g, '""');
    }));
    const escaped = values.map((line) => line.map((value) => `"${value}"`).join(','));
    return [header.join(','), ...escaped].join('\n');
}

function readHistory() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function ExportSourceIndex() {
    return (
        <div className="mx-auto w-full max-w-6xl">
            <header className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]/55">Admin / Export</p>
                <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Pilih Data Export</h1>
                <p className="mt-1 text-sm text-[var(--foreground)]/60">Setiap sumber data memiliki halaman export dan filter tersendiri.</p>
            </header>
            <section aria-label="Sumber data export" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {SOURCE_OPTIONS.filter((source) => !source.disabled).map((source) => {
                    const Icon = source.icon;
                    return (
                        <Link
                            key={source.id}
                            href={`/admin/export/${source.id}`}
                            aria-label={`Export ${source.label}: ${source.description}`}
                            className="group flex min-h-44 flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-blue)]/45 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                                <Icon size={20} />
                            </span>
                            <span className="mt-4 text-base font-bold text-[var(--foreground)]">{source.label}</span>
                            <span className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/60">{source.description}</span>
                            <span className="mt-auto inline-flex min-h-11 items-center gap-1 pt-3 text-sm font-semibold text-[var(--accent-blue)]">
                                Buka export <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    );
                })}
            </section>
        </div>
    );
}

export default function AdminExportPage({ fixedSource }) {
    const [selectedSource, setSelectedSource] = useState(fixedSource || '');
    const [selectedFormat, setSelectedFormat] = useState('csv');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [preview, setPreview] = useState({ rows: [], total: 0, loading: false, error: '' });
    const [exporting, setExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState('Siap diunduh');
    const [progress, setProgress] = useState(0);
    const [showLargeConfirm, setShowLargeConfirm] = useState(false);
    const [history, setHistory] = useState([]);

    const activeSource = useMemo(
        () => SOURCE_OPTIONS.find((item) => item.id === selectedSource) || SOURCE_OPTIONS[0],
        [selectedSource],
    );

    const totalApproxSize = useMemo(
        () => formatBytes(Math.max((preview.total || 0) * 2048, 256 * 1024)),
        [preview.total],
    );

    useEffect(() => {
        setHistory(readHistory());
    }, []);

    useEffect(() => {
        if (!fixedSource) return;
        setSelectedSource(fixedSource);
        setFilters(DEFAULT_FILTERS);
        setSelectedFormat('csv');
    }, [fixedSource]);

    useEffect(() => {
        if (selectedSource !== 'kanji' && selectedFormat === 'pdf') {
            setSelectedFormat('csv');
        }
    }, [selectedFormat, selectedSource]);

    useEffect(() => {
        setPreview({ rows: [], total: 0, loading: true, error: '' });
        if (!selectedSource || selectedSource === 'latihan') {
            setPreview({ rows: [], total: 0, loading: false, error: '' });
            return;
        }

        let isMounted = true;
        const fetchPreview = async () => {
            const token = Cookies.get('access_token');
            try {
                const params = new URLSearchParams({ limit: '10' });
                if (filters.level) params.set('level', filters.level);
                if (filters.search) params.set('search', filters.search);
                if (selectedSource === 'kotoba' && filters.wordType) params.set('word_type', filters.wordType);
                if (selectedSource === 'kanji' && filters.strokesMin) params.set('strokes_min', filters.strokesMin);
                if (selectedSource === 'kanji' && filters.strokesMax) params.set('strokes_max', filters.strokesMax);

                const response = await fetch(`${API_URL}/admin/${activeSource.endpoint}?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error('Preview tidak tersedia untuk sumber data ini.');
                }

                const payload = await response.json();
                const rows = normalizeRows(parseArrayResponse(payload), selectedSource);
                const itemCount = Number(payload?.total ?? rows.length ?? 0);

                if (!isMounted) return;
                setPreview({
                    rows: serializePreviewRows(rows, selectedSource),
                    total: itemCount,
                    loading: false,
                    error: '',
                });
            } catch (error) {
                if (!isMounted) return;
                setPreview({
                    rows: [],
                    total: 0,
                    loading: false,
                    error: error.message || 'Preview tidak tersedia.',
                });
            }
        };

        fetchPreview();
        return () => {
            isMounted = false;
        };
    }, [activeSource.endpoint, filters.level, filters.search, filters.strokesMax, filters.strokesMin, filters.wordType, selectedSource]);

    const resetState = () => {
        setSelectedSource(fixedSource || '');
        setSelectedFormat('csv');
        setFilters(DEFAULT_FILTERS);
        setExportStatus('Siap diunduh');
        setProgress(0);
        setShowLargeConfirm(false);
    };

    const saveHistoryEntry = (source, format, rowCount, status) => {
        const entry = {
            time: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            source: source.label,
            filter: `${format.toUpperCase()} · ${source.label}`,
            format: format.toUpperCase(),
            rows: rowCount,
            status,
        };

        const nextHistory = [entry, ...readHistory()].slice(0, 5);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
        setHistory(nextHistory);
    };

    const fetchSourceRows = async () => {
        const token = Cookies.get('access_token');
        const pageSize = 100;
        const params = new URLSearchParams({ page: '1', limit: String(pageSize) });
        if (filters.level) params.set('level', filters.level);
        if (filters.search) params.set('search', filters.search);
        if (selectedSource === 'kotoba' && filters.wordType) params.set('word_type', filters.wordType);

        const allRows = [];
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages) {
            params.set('page', String(currentPage));
            const response = await fetch(`${API_URL}/admin/${activeSource.endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Tidak dapat mengambil data untuk export.');
            }

            const payload = await response.json();
            const pageRows = parseArrayResponse(payload);
            allRows.push(...pageRows);

            if (Array.isArray(payload)) break;
            totalPages = Number(payload?.pages) || Math.ceil((Number(payload?.total) || pageRows.length) / pageSize) || 1;
            setExportStatus(`Mengambil data... ${allRows.length} dari ${Number(payload?.total) || allRows.length} baris`);
            setProgress(Math.min(70, 10 + Math.round((currentPage / totalPages) * 60)));
            currentPage += 1;
        }

        return normalizeRows(allRows, selectedSource);
    };

    const triggerDownload = (blob, fileName) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
    };

    const performExport = async () => {
        setShowLargeConfirm(false);
        setExporting(true);
        setProgress(10);
        setExportStatus('Mengambil data...');

        try {
            if (selectedSource === 'kanji' && selectedFormat === 'pdf') {
                setExportStatus('Membuka format PDF...');
                const rows = await fetchSourceRows();
                const printWindow = window.open('', '_blank', 'noopener,noreferrer');
                if (!printWindow) {
                    throw new Error('Pop-up diblokir. Izinkan pop-up untuk export PDF.');
                }

                printWindow.document.write(buildKanjiPdfHtml(rows, filters.level, filters.search));
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch {
                        // print fallback
                    }
                }, 400);

                setProgress(100);
                setExportStatus('PDF siap dicetak');
                toast.success(`PDF siap dicetak untuk ${rows.length} item.`);
                saveHistoryEntry(activeSource, 'pdf', rows.length, 'Sukses');
                return;
            }

            const token = Cookies.get('access_token');
            const query = new URLSearchParams();
            if (filters.level) query.set('level', filters.level);
            if (filters.search) query.set('search', filters.search);
            if (selectedSource === 'kotoba' && filters.wordType) query.set('word_type', filters.wordType);

            let fileName = `${selectedSource}_export_${new Date().toISOString().slice(0, 10)}`;
            let blob;
            let statusLabel = 'File berhasil diunduh';

            if (selectedFormat === 'csv') {
                if (selectedSource === 'bunpo') {
                    setExportStatus('Menyusun file CSV...');
                    const rows = await fetchSourceRows();
                    blob = new Blob([buildCsvFromRows(rows, selectedSource)], { type: 'text/csv;charset=utf-8' });
                    fileName += '.csv';
                } else {
                    const response = await fetch(`${API_URL}/admin/${activeSource.endpoint}/export/csv?${query.toString()}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        throw new Error('Endpoint CSV tidak tersedia untuk sumber data ini.');
                    }
                    blob = await response.blob();
                    fileName += '.csv';
                }
            } else if (selectedFormat === 'json') {
                setExportStatus('Menyusun file JSON...');
                const rows = await fetchSourceRows();
                blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8' });
                fileName += '.json';
            } else {
                setExportStatus('Menyusun file spreadsheet...');
                const rows = await fetchSourceRows();
                const csv = buildCsvFromRows(rows, selectedSource);
                blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
                fileName += '.csv';
                statusLabel = 'File spreadsheet siap dibuka di Excel';
            }

            setProgress(80);
            setExportStatus('Mengunduh...');
            triggerDownload(blob, fileName);
            setProgress(100);
            setExportStatus(statusLabel);
            const exportedRows = selectedFormat === 'csv' ? preview.total : undefined;
            toast.success(`${statusLabel}${exportedRows !== undefined ? ` (${exportedRows} baris)` : ''}`);
            saveHistoryEntry(activeSource, selectedFormat, exportedRows ?? preview.total ?? 0, 'Sukses');
        } catch (error) {
            setExportStatus(error.message || 'Gagal menyiapkan file.');
            toast.error(error.message || 'Gagal menyiapkan file.');
            saveHistoryEntry(activeSource, selectedFormat, preview.total || 0, 'Gagal');
        } finally {
            setExporting(false);
            setTimeout(() => setProgress(0), 1200);
        }
    };

    const handleExport = async () => {
        if (!selectedSource || selectedSource === 'latihan' || !selectedFormat) return;
        if (preview.total > 5000) {
            setShowLargeConfirm(true);
            return;
        }
        await performExport();
    };

    if (!fixedSource) return <ExportSourceIndex />;

    const renderFilterFields = () => {
        if (selectedSource === 'kotoba') {
            return (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                        <span className="mb-2 block">Level JLPT</span>
                        <select
                            value={filters.level}
                            onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <option value="">Semua level</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-[var(--foreground)]">
                        <span className="mb-2 block">Tipe kata</span>
                        <select
                            value={filters.wordType}
                            onChange={(event) => setFilters((current) => ({ ...current, wordType: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <option value="">Semua tipe</option>
                            <option value="noun">Kata benda</option>
                            <option value="verb">Kata kerja</option>
                            <option value="adjective">Kata sifat</option>
                            <option value="adverb">Kata keterangan</option>
                            <option value="expression">Expression</option>
                        </select>
                    </label>
                </div>
            );
        }

        if (selectedSource === 'kanji') {
            return (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                        <span className="mb-2 block">Level JLPT</span>
                        <select
                            value={filters.level}
                            onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <option value="">Semua level</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                            <span className="mb-2 block">Minimal goresan</span>
                            <input
                                type="number"
                                value={filters.strokesMin}
                                onChange={(event) => setFilters((current) => ({ ...current, strokesMin: event.target.value }))}
                                className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                                placeholder="0"
                            />
                        </label>
                        <label className="block text-sm font-medium text-[var(--foreground)]">
                            <span className="mb-2 block">Maksimal goresan</span>
                            <input
                                type="number"
                                value={filters.strokesMax}
                                onChange={(event) => setFilters((current) => ({ ...current, strokesMax: event.target.value }))}
                                className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                                placeholder="20"
                            />
                        </label>
                    </div>
                </div>
            );
        }

        if (selectedSource === 'bunpo') {
            return (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                        <span className="mb-2 block">Level JLPT</span>
                        <select
                            value={filters.level}
                            onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <option value="">Semua level</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                    </label>

                </div>
            );
        }

        return (
            <div className="space-y-4">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                    <span className="mb-2 block">Rentang tanggal</span>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        />
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
                            className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                        />
                    </div>
                </label>

                <label className="block text-sm font-medium text-[var(--foreground)]">
                    <span className="mb-2 block">Tipe soal</span>
                    <select
                        value={filters.questionType}
                        onChange={(event) => setFilters((current) => ({ ...current, questionType: event.target.value }))}
                        className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                    >
                        <option value="">Semua tipe</option>
                        <option value="multiple-choice">Pilihan ganda</option>
                        <option value="fill-in">Isian</option>
                        <option value="reading">Membaca</option>
                    </select>
                </label>
            </div>
        );
    };

    const previewFields = activeSource.previewFields;
    const previewRows = preview.rows.length ? preview.rows : [];
    const estimatedCount = Math.max(preview.total || 0, previewRows.length || 0);
    const largeExportWarning = estimatedCount > 10000;
    const availableFormats = selectedSource === 'kanji'
        ? [...FORMAT_OPTIONS, { id: 'pdf', label: 'PDF', description: 'PDF — siap dicetak atau disimpan ke PDF', icon: FileText }]
        : FORMAT_OPTIONS;
    const canDownload = selectedSource && selectedSource !== 'latihan' && selectedFormat && !exporting;

    return (
        <div className="mx-auto w-full max-w-6xl px-0 lg:px-2">
            <div className="mb-6 flex flex-col gap-2">
                <Link href="/admin/export" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-[var(--foreground)]/65 transition hover:text-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]">
                    <ArrowLeft size={16} aria-hidden="true" /> Semua sumber export
                </Link>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--foreground)]/55">Admin / Export / {activeSource.label}</p>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Export {activeSource.label}</h1>
                        <p className="mt-1 text-sm text-[var(--foreground)]/60">Atur filter {activeSource.label.toLowerCase()}, lalu pilih format unduhan.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="space-y-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]/50">1. Filter</p>
                            <div className="mt-3 space-y-4">{renderFilterFields()}</div>
                            <label className="mt-4 block text-sm font-medium text-[var(--foreground)]">
                                <span className="mb-2 block">Pencarian</span>
                                <div className="relative">
                                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/50" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                                        placeholder="Cari kata, judul, atau arti"
                                        className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                                    />
                                </div>
                            </label>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]/50">2. Format</p>
                            <div role="radiogroup" aria-label="Pilih format export" className="mt-3 space-y-3">
                                {availableFormats.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = selectedFormat === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => setSelectedFormat(option.id)}
                                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)] ${
                                                isSelected ? 'border-[var(--accent-blue)]/60 bg-[var(--accent-blue)]/8' : 'border-[var(--border-color)] bg-[var(--background)] hover:border-[var(--border-color)]/80'
                                            }`}
                                        >
                                            <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]' : 'bg-[var(--background)] text-[var(--foreground)]/70'}`}>
                                                <Icon size={16} aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-[var(--foreground)]">{option.label}</span>
                                                <span className="mt-1 block text-xs text-[var(--foreground)]/60">{option.description}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0 space-y-6">
                    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]/50">Pratinjau</p>
                            </div>
                            <span className="text-sm font-medium text-[var(--foreground)]/70 tabular-nums">
                                {estimatedCount} baris · ~{totalApproxSize}
                            </span>
                        </div>

                        {largeExportWarning && (
                            <div className="mb-4">
                                <AppMessage variant="warning" className="text-left">
                                    Export besar — proses mungkin memakan waktu. Yakin ingin melanjutkan?
                                </AppMessage>
                            </div>
                        )}

                        {preview.loading ? (
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)]/60">
                                Memuat opsi export...
                            </div>
                        ) : preview.error ? (
                            <AppMessage variant="warning" className="text-left">
                                {preview.error}
                            </AppMessage>
                        ) : selectedSource === 'latihan' ? (
                            <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--background)] p-6 text-center text-sm text-[var(--foreground)]/60">
                                <Rows3 className="mx-auto mb-2 text-[var(--foreground)]/45" size={24} />
                                <p className="font-medium text-[var(--foreground)]/70">Data latihan belum tersedia untuk export.</p>
                                <p className="mt-1">Endpoint export khusus akan diaktifkan di tahap berikutnya.</p>
                            </div>
                        ) : previewRows.length ? (
                            <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)]/75">
                                                {previewFields.map((field) => (
                                                    <th key={field} className="px-3 py-2.5 font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
                                                        {field.replace(/_/g, ' ')}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, index) => (
                                                <tr key={`${selectedSource}-${index}`} className="border-b border-[var(--border-color)] last:border-b-0">
                                                    {previewFields.map((field) => (
                                                        <td key={`${selectedSource}-${field}-${index}`} className="max-w-[14rem] truncate px-3 py-2.5 text-[var(--foreground)]/80 tabular-nums">
                                                            {row[field] ?? '—'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--background)] p-6 text-center text-sm text-[var(--foreground)]/60">
                                <ListFilter className="mx-auto mb-2 text-[var(--foreground)]/45" size={24} />
                                <p className="font-medium text-[var(--foreground)]/70">Pilih sumber data untuk memulai.</p>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={resetState}
                                className="min-h-11 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                            >
                                Batal / Reset
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={!canDownload}
                                className="min-h-11 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
                                aria-live="polite"
                            >
                                {exporting ? 'Menyiapkan file...' : 'Unduh'}
                            </button>
                        </div>

                        {exporting && (
                            <div className="mt-4" aria-live="polite" aria-busy="true">
                                <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--foreground)]/70">
                                    <span>{exportStatus}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[var(--border-color)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--brand-red)] transition-all duration-300"
                                        style={{ width: `${Math.max(progress, 12)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]/50">Riwayat Export</p>
                            </div>
                            {history.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.localStorage.removeItem(STORAGE_KEY);
                                        setHistory([]);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)]/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                                >
                                    <Trash2 size={13} />
                                    Hapus riwayat
                                </button>
                            )}
                        </div>

                        {history.length ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border-color)] text-[var(--foreground)]/60">
                                            <th className="px-2 py-2 font-semibold">Waktu</th>
                                            <th className="px-2 py-2 font-semibold">Sumber</th>
                                            <th className="px-2 py-2 font-semibold">Filter</th>
                                            <th className="px-2 py-2 font-semibold">Format</th>
                                            <th className="px-2 py-2 font-semibold">Ukuran</th>
                                            <th className="px-2 py-2 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((entry, index) => (
                                            <tr key={`${entry.time}-${index}`} className="border-b border-[var(--border-color)] last:border-b-0">
                                                <td className="px-2 py-2 text-[var(--foreground)]/75">{entry.time}</td>
                                                <td className="px-2 py-2 text-[var(--foreground)]/75">{entry.source}</td>
                                                <td className="px-2 py-2 text-[var(--foreground)]/75">{entry.filter}</td>
                                                <td className="px-2 py-2 text-[var(--foreground)]/75">{entry.format}</td>
                                                <td className="px-2 py-2 text-[var(--foreground)]/75 tabular-nums">{entry.rows} baris</td>
                                                <td className="px-2 py-2">
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${entry.status === 'Sukses' ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--brand-red)]/10 text-[var(--brand-red)]'}`}>
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)]/60">
                                Belum ada riwayat export.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <ConfirmationModal
                isOpen={showLargeConfirm}
                onClose={() => setShowLargeConfirm(false)}
                onConfirm={performExport}
                title="Export besar"
                message="File ini berisi lebih dari 5.000 baris. Proses boleh memakan waktu dan memori lebih besar. Lanjutkan?"
                confirmText="Lanjutkan"
                cancelText="Batal"
                type="warning"
            />
        </div>
    );
}

