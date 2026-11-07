export default function ConceptMap({ nodes = [], edges = [], summary = '' }) {
    if (!Array.isArray(nodes) || !nodes.length) {
        if (summary) {
            return <p className="text-sm leading-relaxed text-[var(--foreground)]">{summary}</p>;
        }
        return null;
    }

    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const centerX = 360;
    const centerY = 190;
    const radius = Math.max(140, 190 + Math.min(nodes.length * 10, 70));

    const positions = Object.fromEntries(nodes.map((node, index) => {
        if (nodes.length === 1) return [node.id, { x: centerX, y: centerY }];
        const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return [node.id, { x, y }];
    }));

    const typeColors = {
        concept: '#f59e0b',
        particle: '#3b82f6',
        copula: '#10b981',
        noun: '#8b5cf6',
        meaning: '#ec4899',
        example: '#f97316',
        politeness: '#14b8a6',
        default: '#94a3b8',
    };

    const edgeLabels = edges.map((edge, index) => {
        const fromNode = positions[edge.from];
        const toNode = positions[edge.to];

        if (!fromNode || !toNode) return null;

        const x = (fromNode.x + toNode.x) / 2;
        const y = (fromNode.y + toNode.y) / 2;
        return { ...edge, key: `${edge.from}-${edge.to}-${index}`, x, y };
    }).filter(Boolean);

    return (
        <>
            {summary && <p className="text-sm leading-relaxed text-[var(--foreground)]">{summary}</p>}
            <div className="hidden sm:block">
                <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--background)]/40 p-3">
                    <svg
                        viewBox="0 0 720 380"
                        className="h-auto min-w-[420px] w-full"
                        role="img"
                        aria-labelledby="concept-map-title concept-map-desc"
                    >
                        <title id="concept-map-title">Peta materi bunpo</title>
                        <desc id="concept-map-desc">Diagram hubungan antara node pada pola tata bahasa.</desc>

                        {edges.map((edge, index) => {
                            const fromNode = positions[edge.from];
                            const toNode = positions[edge.to];
                            if (!fromNode || !toNode) return null;

                            const midpointX = (fromNode.x + toNode.x) / 2;
                            const midpointY = (fromNode.y + toNode.y) / 2;

                            return (
                                <g key={`${edge.from}-${edge.to}-${index}`}>
                                    <line
                                        x1={fromNode.x}
                                        y1={fromNode.y}
                                        x2={toNode.x}
                                        y2={toNode.y}
                                        stroke="var(--border-color)"
                                        strokeWidth="2"
                                        strokeDasharray="6 5"
                                    />
                                    <text
                                        x={midpointX}
                                        y={midpointY - 8}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fill="var(--muted-foreground)"
                                    >
                                        {edge.label}
                                    </text>
                                </g>
                            );
                        })}

                        {nodes.map((node) => {
                            const position = positions[node.id] || { x: centerX, y: centerY };
                            const color = typeColors[node.type] || typeColors.default;
                            return (
                                <g key={node.id}>
                                    <circle
                                        cx={position.x}
                                        cy={position.y}
                                        r={44}
                                        fill={color}
                                        opacity="0.18"
                                        stroke={color}
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={position.x}
                                        y={position.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="12"
                                        fill="var(--foreground)"
                                        fontWeight="700"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <ul className="space-y-2 sm:hidden">
                {edgeLabels.map((edge) => {
                    const fromLabel = nodeMap.get(edge.from)?.label || edge.from;
                    const toLabel = nodeMap.get(edge.to)?.label || edge.to;
                    return (
                        <li key={edge.key} className="text-sm leading-relaxed text-[var(--foreground)]">
                            {fromLabel} → {edge.label} → {toLabel}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
