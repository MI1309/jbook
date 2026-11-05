/**
 * Bunpo API pattern contract. Legacy fields remain required by the API;
 * frontend consumers may normalize optional editorial fields to empty values.
 */
export const BUNPO_PATTERN_SCHEMA = {
    id: 'string (legacy API identifier)',
    title: 'string (required legacy field)',
    structure: 'string (legacy field)',
    explanation: 'string (legacy field)',
    chapter: 'number (legacy field)',
    jlpt_level: 'number (required legacy field)',
    sentences: 'Array<{ jp: string, id: string, expressions?: object[] }> (legacy field)',
    slug: 'string (optional)',
    tags: 'string[] (optional)',
    sections: {
        mainFunction: '{ summary?: string, points?: string[] }',
        sentencePattern: '{ formula?: string, variations?: { label: string, formula: string, example: string }[], notes?: string[] }',
        examples: '{ jp: string, reading?: string, id: string, level?: string, expressions?: { word: string, reading?: string, meaning?: string }[] }[]',
        comparison: '{ summary?: string, items?: { vs: string, difference: string, example: string }[] }',
        nuance: '{ summary?: string, points?: string[] }',
        coreExplanation: '{ summary?: string, text?: string }',
        commonMistakes: '{ wrong: string, correct: string, reason: string }[]',
        faq: '{ q: string, a: string }[]',
        miniPractice: '{ type: string, question: string, options?: string[], answer: string, explanation?: string }[]',
        conceptMap: '{ summary?: string, nodes?: { id: string, label: string, type: string }[], edges?: { from: string, to: string, label: string }[] }',
    },
    relatedPatterns: '{ title: string, slug: string, level: string }[] (optional)',
    source: '{ url?: string, name?: string, license?: string } (optional)',
    metadata: '{ createdAt?: string, updatedAt?: string, version?: string, isComplete?: boolean } (optional)',
};

const SECTION_DEFAULTS = {
    mainFunction: { summary: '', points: [] },
    sentencePattern: { formula: '', variations: [], notes: [] },
    examples: [],
    comparison: { summary: '', items: [] },
    nuance: { summary: '', points: [] },
    coreExplanation: { summary: '', text: '' },
    commonMistakes: [],
    faq: [],
    miniPractice: [],
    conceptMap: { summary: '', nodes: [], edges: [] },
};

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOptionalObject(value, defaults) {
    if (!isRecord(value)) return null;
    return { ...defaults, ...value };
}

/** Adds empty defaults for new optional fields without dropping legacy/API fields. */
export function normalizeBunpoPattern(pattern) {
    if (!isRecord(pattern)) return null;

    const rawSections = isRecord(pattern.sections) ? pattern.sections : {};
    const sections = Object.fromEntries(Object.entries(SECTION_DEFAULTS).map(([key, defaults]) => {
        const value = rawSections[key];
        if (Array.isArray(defaults)) return [key, Array.isArray(value) ? value : []];
        return [key, normalizeOptionalObject(value, defaults)];
    }));

    return {
        ...pattern,
        slug: typeof pattern.slug === 'string' ? pattern.slug : null,
        tags: Array.isArray(pattern.tags) ? pattern.tags : [],
        sections,
        relatedPatterns: Array.isArray(pattern.relatedPatterns) ? pattern.relatedPatterns : [],
        source: normalizeOptionalObject(pattern.source, { url: '', name: '', license: '' }),
        metadata: normalizeOptionalObject(pattern.metadata, {
            createdAt: '',
            updatedAt: '',
            version: '',
            isComplete: false,
        }),
    };
}

function validateString(value, path, errors, { optional = false, allowEmpty = true } = {}) {
    if (value === undefined || value === null) {
        if (!optional) errors.push(`${path} must be a string`);
        return;
    }
    if (typeof value !== 'string' || (!allowEmpty && !value.trim())) errors.push(`${path} must be a${allowEmpty ? '' : ' non-empty'} string`);
}

function validateStringArray(value, path, errors) {
    if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
        return;
    }
    value.forEach((item, index) => validateString(item, `${path}[${index}]`, errors));
}

function validateStringRecords(value, path, errors, fields) {
    if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
        return;
    }
    value.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        if (!isRecord(item)) {
            errors.push(`${itemPath} must be an object`);
            return;
        }
        for (const field of fields) validateString(item[field], `${itemPath}.${field}`, errors);
    });
}

/** Lightweight validation for legacy and extended Bunpo API records. */
export function isValidBunpoPattern(pattern) {
    const errors = [];

    if (!isRecord(pattern)) {
        return { valid: false, errors: ['pattern must be an object'] };
    }
    if (typeof pattern.title !== 'string' || !pattern.title.trim()) {
        errors.push('title must be a non-empty string');
    }
    if (typeof pattern.jlpt_level !== 'number' || !Number.isFinite(pattern.jlpt_level)) {
        errors.push('jlpt_level must be a finite number');
    }
    if (pattern.slug !== undefined && pattern.slug !== null && typeof pattern.slug !== 'string') {
        errors.push('slug must be a string when provided');
    }
    if (pattern.tags !== undefined && !Array.isArray(pattern.tags)) {
        errors.push('tags must be an array when provided');
    } else if (Array.isArray(pattern.tags) && pattern.tags.some((tag) => typeof tag !== 'string')) {
        errors.push('tags entries must be strings');
    }
    if (pattern.sections !== undefined && pattern.sections !== null && !isRecord(pattern.sections)) {
        errors.push('sections must be an object when provided');
    } else if (isRecord(pattern.sections)) {
        const sections = pattern.sections;
        for (const key of ['mainFunction', 'sentencePattern', 'comparison', 'nuance', 'coreExplanation', 'conceptMap']) {
            if (sections[key] !== undefined && sections[key] !== null && !isRecord(sections[key])) {
                errors.push(`sections.${key} must be an object when provided`);
            }
        }
        for (const key of ['examples', 'commonMistakes', 'faq', 'miniPractice']) {
            if (sections[key] !== undefined && !Array.isArray(sections[key])) errors.push(`sections.${key} must be an array when provided`);
        }
        if (isRecord(sections.mainFunction)) {
            validateString(sections.mainFunction.summary, 'sections.mainFunction.summary', errors, { optional: true });
            if (sections.mainFunction.points !== undefined) validateStringArray(sections.mainFunction.points, 'sections.mainFunction.points', errors);
        }
        if (isRecord(sections.sentencePattern)) {
            validateString(sections.sentencePattern.formula, 'sections.sentencePattern.formula', errors, { optional: true });
            if (sections.sentencePattern.notes !== undefined) validateStringArray(sections.sentencePattern.notes, 'sections.sentencePattern.notes', errors);
            if (sections.sentencePattern.variations !== undefined) validateStringRecords(sections.sentencePattern.variations, 'sections.sentencePattern.variations', errors, ['label', 'formula', 'example']);
        }
        if (Array.isArray(sections.examples)) {
            sections.examples.forEach((example, index) => {
                const path = `sections.examples[${index}]`;
                if (!isRecord(example)) errors.push(`${path} must be an object`);
                else {
                    validateString(example.jp, `${path}.jp`, errors);
                    validateString(example.id, `${path}.id`, errors);
                    validateString(example.reading, `${path}.reading`, errors, { optional: true });
                    validateString(example.level, `${path}.level`, errors, { optional: true });
                    if (example.expressions !== undefined) validateStringRecords(example.expressions, `${path}.expressions`, errors, ['word']);
                }
            });
        }
        if (isRecord(sections.comparison)) {
            validateString(sections.comparison.summary, 'sections.comparison.summary', errors, { optional: true });
            if (sections.comparison.items !== undefined) validateStringRecords(sections.comparison.items, 'sections.comparison.items', errors, ['vs', 'difference', 'example']);
        }
        if (isRecord(sections.nuance)) {
            validateString(sections.nuance.summary, 'sections.nuance.summary', errors, { optional: true });
            if (sections.nuance.points !== undefined) validateStringArray(sections.nuance.points, 'sections.nuance.points', errors);
        }
        if (isRecord(sections.coreExplanation)) {
            validateString(sections.coreExplanation.summary, 'sections.coreExplanation.summary', errors, { optional: true });
            validateString(sections.coreExplanation.text, 'sections.coreExplanation.text', errors, { optional: true });
        }
        if (sections.commonMistakes !== undefined) validateStringRecords(sections.commonMistakes, 'sections.commonMistakes', errors, ['wrong', 'correct', 'reason']);
        if (sections.faq !== undefined) validateStringRecords(sections.faq, 'sections.faq', errors, ['q', 'a']);
        if (sections.miniPractice !== undefined) validateStringRecords(sections.miniPractice, 'sections.miniPractice', errors, ['type', 'question', 'answer']);
        if (isRecord(sections.conceptMap)) {
            validateString(sections.conceptMap.summary, 'sections.conceptMap.summary', errors, { optional: true });
            if (sections.conceptMap.nodes !== undefined) validateStringRecords(sections.conceptMap.nodes, 'sections.conceptMap.nodes', errors, ['id', 'label', 'type']);
            if (sections.conceptMap.edges !== undefined) validateStringRecords(sections.conceptMap.edges, 'sections.conceptMap.edges', errors, ['from', 'to', 'label']);
        }
    }
    if (pattern.relatedPatterns !== undefined && !Array.isArray(pattern.relatedPatterns)) {
        errors.push('relatedPatterns must be an array when provided');
    }
    if (pattern.source !== undefined && pattern.source !== null && !isRecord(pattern.source)) {
        errors.push('source must be an object when provided');
    }
    if (pattern.metadata !== undefined && pattern.metadata !== null && !isRecord(pattern.metadata)) {
        errors.push('metadata must be an object when provided');
    }
    if (Array.isArray(pattern.relatedPatterns)) {
        pattern.relatedPatterns.forEach((related, index) => {
            const path = `relatedPatterns[${index}]`;
            if (!isRecord(related)) errors.push(`${path} must be an object`);
            else ['title', 'slug', 'level'].forEach((field) => validateString(related[field], `${path}.${field}`, errors));
        });
    }
    if (isRecord(pattern.source)) {
        ['url', 'name', 'license'].forEach((field) => validateString(pattern.source[field], `source.${field}`, errors, { optional: true }));
    }
    if (isRecord(pattern.metadata)) {
        ['createdAt', 'updatedAt', 'version'].forEach((field) => validateString(pattern.metadata[field], `metadata.${field}`, errors, { optional: true }));
        if (pattern.metadata.isComplete !== undefined && typeof pattern.metadata.isComplete !== 'boolean') errors.push('metadata.isComplete must be a boolean');
    }

    return { valid: errors.length === 0, errors };
}