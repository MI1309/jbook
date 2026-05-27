'use client';

const STORAGE_KEY = 'guest_practice_analytics';
const MAX_WRONG = 50;

/**
 * Struktur data default (juga dipakai untuk migrasi data lama).
 */
const defaultData = () => ({
    total_attempts: 0,
    accuracy: 0,
    wrong_stats: [],
    kakitori_stats: {
        total_attempts: 0,   // jumlah sesi kakitori yang diselesaikan
        total_questions: 0,  // total soal kakitori yang dijawab
        correct: 0,          // total jawaban benar kakitori
        accuracy: 0,         // persentase akurasi kakitori
        level_breakdown: []  // akurasi per level JLPT
    }
});

/**
 * Logika evaluasi status kesalahan.
 * Identik dengan implementasi backend (learning/api.py).
 */
function getStatusLabel(count, rightCount) {
    if (count >= 4) return 'Perbaiki';
    if (count === 3) return 'Cukup';
    if (count === 2) return 'Lumayan';
    if (count === 1 && rightCount === 0) return 'Lumayan';
    return '';
}

/**
 * Baca analytics dari localStorage.
 * Jika tidak ada atau korup, return default.
 * Juga menangani migrasi data lama yang belum punya kakitori_stats.
 */
export function getGuestAnalytics() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultData();

        const data = JSON.parse(raw);

        // Migrasi: data lama mungkin belum punya kakitori_stats
        if (!data.kakitori_stats) {
            data.kakitori_stats = defaultData().kakitori_stats;
        }
        // Migrasi: pastikan semua field kakitori_stats ada
        const def = defaultData().kakitori_stats;
        data.kakitori_stats = { ...def, ...data.kakitori_stats };

        return data;
    } catch {
        return defaultData();
    }
}

/**
 * Simpan hasil latihan ke localStorage.
 * Menangani semua mode: 'choice', 'kakitori'.
 *
 * @param {Array} newResults - Array attempt dari PracticeRunner
 *   Setiap item: { question_id, type, character, is_correct,
 *                  answer_given, correct_meaning, correct_answer,
 *                  level, mode }
 */
export function saveGuestResults(newResults) {
    if (!newResults || newResults.length === 0) return;

    try {
        const current = getGuestAnalytics();

        // ── 1. Hitung akurasi global (semua mode) ──
        const prevCorrect = Math.round((current.accuracy / 100) * current.total_attempts);
        const newTotal = current.total_attempts + newResults.length;
        const newCorrectCount = prevCorrect + newResults.filter(r => r.is_correct).length;
        current.total_attempts = newTotal;
        current.accuracy = newTotal > 0
            ? parseFloat(((newCorrectCount / newTotal) * 100).toFixed(1))
            : 0;

        // ── 2. Update wrong_stats (semua mode masuk agar histori lengkap) ──
        const wrongMap = new Map();
        (current.wrong_stats || []).forEach(m => {
            const type = normalizeType(m.type);
            const key = `${type}|${m.character}`;
            wrongMap.set(key, { ...m, type, right_count: m.right_count || 0 });
        });

        newResults.forEach(r => {
            const type = normalizeType(r.type);
            const key = `${type}|${r.character}`;
            const entry = wrongMap.get(key) || {
                character: r.character,
                type,
                count: 0,
                right_count: 0,
                status: ''
            };
            if (r.is_correct) {
                entry.right_count = (entry.right_count || 0) + 1;
            } else {
                entry.count = (entry.count || 0) + 1;
            }
            entry.status = getStatusLabel(entry.count, entry.right_count);
            wrongMap.set(key, entry);
        });

        current.wrong_stats = Array.from(wrongMap.values())
            .filter(m => m.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, MAX_WRONG);

        // ── 3. Update kakitori_stats (hanya dari mode kakitori) ──
        const kakitoriResults = newResults.filter(r => r.mode === 'kakitori');

        if (kakitoriResults.length > 0) {
            const ks = current.kakitori_stats;

            // Setiap pemanggilan saveGuestResults dengan kakitori = 1 sesi selesai
            ks.total_attempts = (ks.total_attempts || 0) + 1;
            ks.total_questions = (ks.total_questions || 0) + kakitoriResults.length;

            const batchCorrect = kakitoriResults.filter(r => r.is_correct).length;
            ks.correct = (ks.correct || 0) + batchCorrect;
            ks.accuracy = ks.total_questions > 0
                ? parseFloat(((ks.correct / ks.total_questions) * 100).toFixed(1))
                : 0;

            // Update level_breakdown
            const lvlMap = new Map();
            (ks.level_breakdown || []).forEach(l => lvlMap.set(String(l.level), { ...l }));

            kakitoriResults.forEach(r => {
                const lvl = String(r.level || 5);
                const entry = lvlMap.get(lvl) || { level: parseInt(lvl), total: 0, correct: 0, accuracy: 0 };
                entry.total += 1;
                if (r.is_correct) entry.correct += 1;
                entry.accuracy = parseFloat(((entry.correct / entry.total) * 100).toFixed(1));
                lvlMap.set(lvl, entry);
            });

            ks.level_breakdown = Array.from(lvlMap.values())
                .sort((a, b) => b.level - a.level);

            current.kakitori_stats = ks;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

    } catch (e) {
        console.error('[local-analytics] saveGuestResults error:', e);
    }
}

/**
 * Hapus semua analytics guest dari localStorage.
 */
export function clearGuestAnalytics() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Normalisasi tipe data untuk konsistensi histori.
 * bunpo → grammar, kotoba → vocab
 */
function normalizeType(type) {
    if (type === 'bunpo') return 'grammar';
    if (type === 'kotoba') return 'vocab';
    return type || 'kanji';
}