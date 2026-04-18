import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = process.cwd();
const knowledgeDir = path.join(root, 'knowledge');
const publicKnowledgeDir = path.join(root, 'public', 'knowledge');
const tsOutput = path.join(root, 'src', 'lib', 'generatedKnowledge.ts');
const dartOutput = path.join(root, 'lib', 'src', 'generated', 'generated_knowledge.dart');

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function dedupeStrings(values) {
  return [...new Set(values.map((value) => `${value}`.trim()).filter(Boolean))];
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeEntry(entry, sourceMap) {
  const source = sourceMap.get(entry.sourceId);
  if (!source) {
    throw new Error(`Unknown sourceId "${entry.sourceId}" for knowledge entry "${entry.id}"`);
  }

  const steps = dedupeStrings(ensureArray(entry.steps, `steps for ${entry.id}`));
  const contraindications = dedupeStrings(
    ensureArray(entry.contraindications, `contraindications for ${entry.id}`),
  );

  return {
    id: normalizeString(entry.id),
    pack: normalizeString(entry.pack, source.pack),
    route: normalizeString(entry.route),
    title: normalizeString(entry.title),
    source: normalizeString(entry.source, `${source.authority}: ${source.title}`),
    summary: normalizeString(entry.summary),
    steps,
    contraindications,
    escalation: normalizeString(entry.escalation),
    tags: dedupeStrings(ensureArray(entry.tags, `tags for ${entry.id}`)),
    aliases: dedupeStrings(ensureArray(entry.aliases, `aliases for ${entry.id}`)),
    category: normalizeString(entry.category),
    region: dedupeStrings(ensureArray(entry.region ?? [], `region for ${entry.id}`)),
    eraLabel: normalizeString(entry.eraLabel),
    eraStart: typeof entry.eraStart === 'number' ? entry.eraStart : undefined,
    eraEnd: typeof entry.eraEnd === 'number' ? entry.eraEnd : undefined,
    socialFit: dedupeStrings(ensureArray(entry.socialFit ?? [], `socialFit for ${entry.id}`)),
    startingResources: dedupeStrings(
      ensureArray(entry.startingResources ?? [], `startingResources for ${entry.id}`),
    ),
    firstMoves: dedupeStrings(ensureArray(entry.firstMoves ?? [], `firstMoves for ${entry.id}`)),
    payoff: normalizeString(entry.payoff),
    fatalMistakes: dedupeStrings(
      ensureArray(entry.fatalMistakes ?? [], `fatalMistakes for ${entry.id}`),
    ),
    coverStory: normalizeString(entry.coverStory),
    feasibility: normalizeString(entry.feasibility, 'moderate'),
    priority: Number.isFinite(entry.priority) ? entry.priority : 0,
    sourceId: normalizeString(entry.sourceId),
    sourceUrl: normalizeString(entry.sourceUrl, source.finalUrl),
    locale: normalizeString(entry.locale, 'en'),
    severity: normalizeString(entry.severity, 'strategic'),
  };
}

function escapeDartString(value) {
  return `${value}`
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n');
}

function dartList(values, indent = '        ') {
  if (!values.length) {
    return 'const <String>[]';
  }

  return `[\n${values.map((value) => `${indent}'${escapeDartString(value)}'`).join(',\n')},\n      ]`;
}

const manifest = JSON.parse(await readFile(path.join(knowledgeDir, 'source_manifest.json'), 'utf8'));
const seed = JSON.parse(await readFile(path.join(knowledgeDir, 'entry_seed.json'), 'utf8'));

const sources = ensureArray(manifest.sources ?? manifest, 'sources').map((source) => ({
  id: normalizeString(source.id),
  authority: normalizeString(source.authority),
  title: normalizeString(source.title),
  finalUrl: normalizeString(source.finalUrl),
  fileName: normalizeString(source.fileName),
  ext: normalizeString(source.ext),
  pack: normalizeString(source.pack),
  license: normalizeString(source.license),
}));

const sourceIds = new Set();
for (const source of sources) {
  if (!source.id) {
    throw new Error('Every source must include an id');
  }
  if (sourceIds.has(source.id)) {
    throw new Error(`Duplicate source id: ${source.id}`);
  }
  sourceIds.add(source.id);
}

const sourceMap = new Map(sources.map((source) => [source.id, source]));
const entries = ensureArray(seed.entries ?? seed, 'entries').map((entry) => normalizeEntry(entry, sourceMap));

const entryIds = new Set();
for (const entry of entries) {
  if (!entry.id) {
    throw new Error('Every knowledge entry must include an id');
  }
  if (entryIds.has(entry.id)) {
    throw new Error(`Duplicate knowledge entry id: ${entry.id}`);
  }
  entryIds.add(entry.id);
}

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sources,
  entries,
};

await mkdir(knowledgeDir, { recursive: true });
await mkdir(publicKnowledgeDir, { recursive: true });
await mkdir(path.dirname(tsOutput), { recursive: true });
await mkdir(path.dirname(dartOutput), { recursive: true });

await writeFile(
  path.join(knowledgeDir, 'offline_knowledge.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
);
await writeFile(
  path.join(publicKnowledgeDir, 'offline_knowledge.json'),
  `${JSON.stringify(payload)}\n`,
);

const tsSource = `// Auto-generated by scripts/build_offline_knowledge.mjs
export const generatedKnowledgePayload = ${JSON.stringify(payload, null, 2)} as const;

export const generatedKnowledgeSources = generatedKnowledgePayload.sources;
export const generatedKnowledgeEntries = generatedKnowledgePayload.entries;
`;
await writeFile(tsOutput, tsSource);

const dartEntries = entries.map((entry) => `  const KnowledgeEntry(
      id: '${escapeDartString(entry.id)}',
      title: '${escapeDartString(entry.title)}',
      summary: '${escapeDartString(entry.summary)}',
      steps: ${dartList(entry.steps)},
      contraindications: ${dartList(entry.contraindications)},
      escalation: '${escapeDartString(entry.escalation)}',
      tags: ${dartList(entry.tags)},
      aliases: ${dartList(entry.aliases)},
      source: '${escapeDartString(entry.source)}',
      sourceUrl: '${escapeDartString(entry.sourceUrl)}',
      priority: ${entry.priority},
      locale: '${escapeDartString(entry.locale)}',
      severity: '${escapeDartString(entry.severity)}',
    )`).join(',\n');

const dartSource = `// Auto-generated by scripts/build_offline_knowledge.mjs
import '../models/knowledge_models.dart';

final List<KnowledgeEntry> generatedKnowledgeEntries = <KnowledgeEntry>[
${dartEntries}
];
`;
await writeFile(dartOutput, dartSource);

console.log(`Timet knowledge build complete: ${sources.length} sources, ${entries.length} entries`);
