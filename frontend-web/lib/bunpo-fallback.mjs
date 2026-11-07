function hasSectionContent(value) {
    if (typeof value === 'string') return Boolean(value.trim());
    if (Array.isArray(value)) return value.some(hasSectionContent);
    if (value && typeof value === 'object') return Object.values(value).some(hasSectionContent);
    return false;
}

export function applyPilotFallback(grammar, requestedSlug, pilot) {
    if (!grammar || hasSectionContent(grammar.sections)) return grammar;

    const pilotEntry = pilot?.[grammar.slug] || pilot?.[requestedSlug]
        || Object.values(pilot || {}).find((item) => item.title === grammar.title);
    return pilotEntry ? { ...grammar, sections: pilotEntry.sections } : grammar;
}