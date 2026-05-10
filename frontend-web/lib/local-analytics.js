
const STORAGE_KEY = 'guest_practice_analytics';

export function getGuestAnalytics() {
    if (typeof window === 'undefined') return { total_attempts: 0, accuracy: 0, wrong_stats: [] };

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        return {
            total_attempts: 0,
            accuracy: 0,
            wrong_stats: []
        };
    }

    try {
        let current = JSON.parse(data);
        
        // Migrate old 'bunpo' to 'grammar'
        let changed = false;
        if (current.wrong_stats) {
            current.wrong_stats.forEach(item => {
                if (item.type === 'bunpo') {
                    item.type = 'grammar';
                    changed = true;
                }
            });
        }
        if (changed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        }
        
        return current;
    } catch (e) {
        console.error("Failed to parse guest analytics", e);
        return { total_attempts: 0, accuracy: 0, wrong_stats: [] };
    }
}

export function saveGuestResults(newResults) {
    const current = getGuestAnalytics();

    // Calculate new stats
    const correctCount = newResults.filter(r => r.is_correct).length;
    const totalNew = newResults.length;

    // Update basic stats
    // We need to store raw counts to recalculate accuracy accurately
    // Current analytics object returns percentage, so we might need to store raw counts separately
    // OR roughly estimate. 
    // Better: Store raw counts in a separate internal fields if possible, or just parse carefully.
    // Let's assume current.total_attempts is raw. 
    // Accuracy is %. We need total correct attempts.
    // Let's recover approximate total correct: (accuracy / 100) * total_attempts

    const prevTotal = current.total_attempts;
    const prevCorrect = Math.round((current.accuracy / 100) * prevTotal);

    const newTotal = prevTotal + totalNew;
    const newCorrect = prevCorrect + correctCount;
    const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;

    // Update wrong stats
    // newResults has { question_id, type, is_correct, answer_given, (kanji/vocab/grammar object data?) }
    // Wait, submitPracticeResults sends question_id. 
    // But for local storage, we need the CHARACTER/WORD to display it later.
    // The `newResults` array in `PracticeStartPage` (start/page.jsx) stores `attempt` objects.
    // Let's verify what `start/page.jsx` puts in `results`.
    // It puts: { question_id, type, is_correct, answer_given }
    // It DOES NOT put the character/word text. 
    // I NEED TO UPDATE `start/page.jsx` to include `character` or `text` in the result object 
    // so I can save it locally. Backend looks up ID, but LocalStorage cannot.

    // Let's assume I will update start/page.jsx to include `character` in the result.

    const wrongMap = new Map();

    // Hydrate map from existing wrong_stats
    current.wrong_stats.forEach(item => {
        wrongMap.set(item.character + '|' + item.type, { ...item });
    });

    // Update wrong stats
    newResults.forEach(res => {
        const label = res.character || res.word || res.title;
        if (!label) return;

        const key = label + '|' + res.type;
        if (!wrongMap.has(key)) {
            wrongMap.set(key, {
                character: label,
                count: 0,
                right_count: 0,
                type: res.type,
                level: res.level
            });
        }

        const item = wrongMap.get(key);
        if (res.is_correct) {
            item.right_count = (item.right_count || 0) + 1;
        } else {
            item.count += 1;
        }
    });

    // Helper for status (Logic must match backend learning/api.py)
    const getStatusLabel = (wrong, right) => {
        if (wrong <= 0) return null;
        if (wrong === 1 && (right || 0) >= 1) return null;
        if (wrong >= 4) return "Perbaiki";
        if (wrong === 3) return "Cukup";
        if (wrong === 2) return "Lumayan";
        return "Lumayan"; 
    };

    const wrong_stats = Array.from(wrongMap.values())
        .filter(item => item.count > 0)
        .map(item => ({
            ...item,
            status: getStatusLabel(item.count, item.right_count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

    // Calculate level stats for guest
    // We'll store level_raw in the analytics object to keep track of totals
    const levelRaw = current.level_raw || {};
    newResults.forEach(res => {
        if (res.level) {
            if (!levelRaw[res.level]) {
                levelRaw[res.level] = { total: 0, correct: 0 };
            }
            levelRaw[res.level].total += 1;
            if (res.is_correct) levelRaw[res.level].correct += 1;
        }
    });

    const level_stats = Object.keys(levelRaw).map(lvl => ({
        level: parseInt(lvl),
        total: levelRaw[lvl].total,
        correct: levelRaw[lvl].correct,
        accuracy: parseFloat(((levelRaw[lvl].correct / levelRaw[lvl].total) * 100).toFixed(1))
    })).sort((a, b) => b.level - a.level);

    const updated = {
        total_attempts: newTotal,
        accuracy: parseFloat(newAccuracy.toFixed(1)),
        wrong_stats,
        level_stats,
        level_raw: levelRaw
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

export function resetGuestAnalytics() {
    localStorage.removeItem(STORAGE_KEY);
    return { status: 'success' };
}
