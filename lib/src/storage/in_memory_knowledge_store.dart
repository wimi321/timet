import 'dart:math';

import '../contracts/knowledge_store.dart';
import '../models/knowledge_models.dart';

final List<({RegExp pattern, List<String> variants})> _semanticQueryRules = [
  (
    pattern: RegExp(
        r'首富|发财|發財|赚钱|賺錢|第一桶金|生意|买卖|買賣|商路|套利|账本|帳本|merchant|trade|profit|fortune|rich|business|ledger|brokerage|guineas',
        caseSensitive: false),
    variants: <String>[
      'fortune line',
      'merchant line',
      'mercantile ladders',
      'first fortune',
      'ledger',
      'brokerage',
    ],
  ),
  (
    pattern: RegExp(
        r'上位|掌权|掌權|称王|稱王|皇帝|摄政|攝政|官场|官場|宫廷|宮廷|权臣|權臣|门客|門客|派系|court|faction|office|patronage|patron|household|influence|throne|power|legitimacy',
        caseSensitive: false),
    variants: <String>[
      'power line',
      'court ladder',
      'patronage ladder',
      'court and patronage ladders',
      'influence',
      'legitimacy',
    ],
  ),
  (
    pattern: RegExp(
        r'避坑|保命|活下来|活下來|藏锋|藏鋒|别暴露|別暴露|融入|礼法|禮法|口音|习俗|習俗|blend in|fatal mistake|custom|etiquette|cover story|suspicion|uncanny',
        caseSensitive: false),
    variants: <String>[
      'fatal mistakes',
      'arrival survival',
      'arrival survival protocols',
      'cover story',
      'blend in',
      'etiquette',
    ],
  ),
  (
    pattern: RegExp(
        r'技术|技術|发明|發明|工艺|工藝|肥皂|玻璃|印刷|蒸馏|蒸餾|标准化|標準化|组织|組織|supply chain|process|technology|printing|soap|glass|manufacture|standardization|modern knowledge|modern edge',
        caseSensitive: false),
    variants: <String>[
      'modern edge',
      'modern edge methods',
      'process',
      'standardization',
      'workshop',
      'supply chain',
    ],
  ),
];

String _entrySourceText(KnowledgeEntry entry) {
  return <String>[
    entry.source,
    entry.sourceUrl,
    ...entry.tags,
    ...entry.aliases,
    entry.title,
    entry.summary,
  ].join(' ').toLowerCase();
}

double _sourceIntentBoost(KnowledgeEntry entry, String query) {
  final sourceText = _entrySourceText(entry);
  var boost = 0.0;

  if (RegExp(r'首富|发财|發財|赚钱|賺錢|第一桶金|fortune|profit|rich|merchant|trade',
          caseSensitive: false)
      .hasMatch(query)) {
    if (RegExp(r'mercantile|fortune line|merchant|ledger|brokerage|首富线|小本生意',
            caseSensitive: false)
        .hasMatch(sourceText)) {
      boost += 32;
    }
  }

  if (RegExp(r'上位|掌权|掌權|皇帝|宫廷|宮廷|court|faction|patronage|power|influence',
          caseSensitive: false)
      .hasMatch(query)) {
    if (RegExp(r'court|patronage|power line|household|legitimacy|上位线|门路',
            caseSensitive: false)
        .hasMatch(sourceText)) {
      boost += 30;
    }
  }

  if (RegExp(r'避坑|保命|别暴露|別暴露|融入|blend in|fatal mistake|cover story|etiquette',
          caseSensitive: false)
      .hasMatch(query)) {
    if (RegExp(r'arrival survival|fatal mistakes|cover story|blend in|避坑线|礼法',
            caseSensitive: false)
        .hasMatch(sourceText)) {
      boost += 28;
    }
  }

  if (RegExp(
          r'技术|技術|发明|發明|工艺|工藝|现代知识|modern edge|process|standardization|workshop',
          caseSensitive: false)
      .hasMatch(query)) {
    if (RegExp(
            r'modern edge|process|standardization|workshop|supply chain|现代知识外挂',
            caseSensitive: false)
        .hasMatch(sourceText)) {
      boost += 30;
    }
  }

  return boost;
}

class InMemoryKnowledgeStore implements KnowledgeStore {
  final Map<String, KnowledgeEntry> _entries = <String, KnowledgeEntry>{};

  @override
  Future<void> upsertAll(List<KnowledgeEntry> entries) async {
    for (final entry in entries) {
      _entries[entry.id] = entry;
    }
  }

  @override
  Future<List<KnowledgeEntry>> findByCategory({
    required String category,
    required int limit,
  }) async {
    final normalizedCategory = category.trim().toLowerCase();
    if (normalizedCategory.isEmpty) {
      return const <KnowledgeEntry>[];
    }

    final matched = _entries.values.where((entry) {
      final candidates = <String>[
        entry.title,
        ...entry.tags,
        ...entry.aliases,
      ].map((value) => value.toLowerCase());

      return candidates.any(
        (candidate) =>
            candidate.contains(normalizedCategory) ||
            normalizedCategory.contains(candidate),
      );
    }).toList()
      ..sort((a, b) => b.priority.compareTo(a.priority));

    return matched.take(limit).toList(growable: false);
  }

  @override
  Future<List<RetrievedKnowledge>> search({
    required String query,
    required int limit,
  }) async {
    final normalizedQuery = query.toLowerCase().trim();
    final normalizedTerms = _tokenize(normalizedQuery);
    if (normalizedTerms.isEmpty) {
      return const <RetrievedKnowledge>[];
    }

    final totalEntries = _entries.length;
    final scored = _entries.values
        .map((entry) =>
            _scoreEntry(entry, normalizedQuery, normalizedTerms, totalEntries))
        .where((result) => result != null)
        .cast<RetrievedKnowledge>()
        .toList()
      ..sort((a, b) => b.score.compareTo(a.score));

    return scored.take(limit).toList(growable: false);
  }

  RetrievedKnowledge? _scoreEntry(
    KnowledgeEntry entry,
    String normalizedQuery,
    List<String> queryTerms,
    int totalEntries,
  ) {
    final documentTerms = _tokenize(entry.searchableText);
    if (documentTerms.isEmpty) {
      return null;
    }

    final termFrequency = <String, int>{};
    for (final term in documentTerms) {
      termFrequency.update(term, (value) => value + 1, ifAbsent: () => 1);
    }

    final uniqueQueryTerms = queryTerms.toSet().toList(growable: false);
    final matchedTerms = <String>[];
    var lexicalScore = 0.0;

    for (final term in uniqueQueryTerms) {
      final frequency = termFrequency[term];
      if (frequency == null) {
        continue;
      }

      matchedTerms.add(term);
      final docsWithTerm = _entries.values
          .where(
            (candidate) => candidate.searchableText.contains(term),
          )
          .length;
      final inverseDocumentFrequency =
          log(((totalEntries - docsWithTerm) + 0.5) / (docsWithTerm + 0.5) + 1);
      final normalizedFrequency =
          frequency / (0.5 + 1.5 * documentTerms.length / 32);

      lexicalScore += inverseDocumentFrequency * normalizedFrequency;
    }

    if (matchedTerms.isEmpty) {
      return null;
    }

    final weightedScore = lexicalScore +
        entry.priority / 8 +
        _sourceIntentBoost(entry, normalizedQuery);
    return RetrievedKnowledge(
      entry: entry,
      score: min(100, weightedScore),
      isAuthoritative: entry.priority >= 8,
      strategy: RetrievalStrategy.lexical,
      matchedTerms: matchedTerms,
    );
  }

  List<String> _tokenize(String input) {
    final normalized = input.toLowerCase().trim();
    if (normalized.isEmpty) {
      return const <String>[];
    }

    final variants = _buildQueryVariants(normalized);
    final coarseTokens = <String>[];
    final cjkBigrams = <String>[];

    for (final variant in variants) {
      coarseTokens.addAll(
        variant
            .split(RegExp(r'[^a-z0-9一-龿]+'))
            .where((token) => token.isNotEmpty),
      );

      final compact = variant.replaceAll(RegExp(r'\s+'), '');
      for (var index = 0; index < compact.length - 1; index++) {
        final pair = compact.substring(index, index + 2);
        if (RegExp(r'[一-龿]').hasMatch(pair)) {
          cjkBigrams.add(pair);
        }
      }
    }

    return <String>{...variants, ...coarseTokens, ...cjkBigrams}
        .toList(growable: false);
  }

  List<String> _buildQueryVariants(String normalized) {
    final variants = <String>{normalized};
    for (final rule in _semanticQueryRules) {
      if (rule.pattern.hasMatch(normalized)) {
        variants.addAll(rule.variants.map((variant) => variant.toLowerCase()));
      }
    }
    return variants.toList(growable: false);
  }
}
