function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function matchesType(entryType, requestedType) {
    if (['vocab', 'kotoba'].includes(requestedType)) return entryType === 'vocab';
    if (['grammar', 'bunpo'].includes(requestedType)) return entryType === 'grammar';
    return entryType === requestedType;
}

export function allocateQuestionsByType(entries, requestedTypes, limit) {
    const types = [...new Set(requestedTypes.filter(Boolean))];
    if (!types.length || limit <= 0) return [];

    const baseQuota = Math.floor(limit / types.length);
    let extraQuota = limit % types.length;
    const selected = [];
    const selectedEntries = new Set();
    const remainingByType = new Map();

    types.forEach((requestedType) => {
        const quota = baseQuota + (extraQuota > 0 ? 1 : 0);
        if (extraQuota > 0) extraQuota -= 1;

        const available = shuffle(entries.filter(entry => (
            matchesType(entry.type, requestedType) && !selectedEntries.has(entry)
        )));
        const chosen = available.slice(0, quota);
        chosen.forEach(entry => selectedEntries.add(entry));
        selected.push(...chosen);
        remainingByType.set(requestedType, available.slice(quota));
    });

    const unusedSlots = Math.max(0, limit - selected.length);
    if (unusedSlots > 0) {
        const overflow = shuffle([...new Set([...remainingByType.values()].flat())])
            .filter(entry => !selectedEntries.has(entry));
        const overflowSelection = overflow.slice(0, unusedSlots);
        overflowSelection.forEach(entry => selectedEntries.add(entry));
        selected.push(...overflowSelection);
    }

    return shuffle(selected);
}
