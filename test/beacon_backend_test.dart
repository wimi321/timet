import 'package:beacon_backend/beacon_backend.dart';
import 'package:test/test.dart';

void main() {
  test('bootstrap knowledge ships the Timet offline strategy bundle', () {
    final entries = BootstrapModels.routeSeedKnowledge();
    expect(entries.length, greaterThanOrEqualTo(10));
    expect(entries.first.sourceUrl, isNotEmpty);
    expect(
      entries.any((entry) => entry.source.contains('Timet Curated Pack')),
      isTrue,
    );
    expect(
      entries.any((entry) => entry.id == 'zh-song-kaifeng-wealth'),
      isTrue,
    );
    expect(
      entries.any((entry) => entry.id == 'en-late-qing-wealth'),
      isTrue,
    );
    expect(
      entries.any((entry) => entry.id == 'zh-modern-edge'),
      isTrue,
    );
    expect(
      entries.any((entry) => entry.id == 'en-arrival-survival'),
      isTrue,
    );
    expect(
      entries.any((entry) => entry.id == 'en-visual-clue'),
      isTrue,
    );
  });

  test('knowledge store expands Timet route queries', () async {
    final store = InMemoryKnowledgeStore();
    await store.upsertAll([
      const KnowledgeEntry(
        id: 'fortune-regency',
        title: 'Regency London First Fortune Line',
        summary: 'Clean books and discreet errands create repeat business.',
        steps: ['Start with copying, bookkeeping, and broker errands.'],
        contraindications: ['Do not pretend to be a gentleman investor.'],
        escalation: 'Move into agency work once trust is stable.',
        tags: ['fortune line', 'Regency London', 'merchant', 'ledger'],
        aliases: ['first fortune', 'a few guineas'],
        source: 'Timet Curated Pack: Mercantile Ladders',
        priority: 9,
      ),
      const KnowledgeEntry(
        id: 'power-tudor',
        title: 'Tudor London Patronage Ladder',
        summary: 'Rise through household papers, provisions, and favors.',
        steps: ['Enter a household as clerk, scrivener, or discreet runner.'],
        contraindications: ['Do not speak about religion or succession early.'],
        escalation: 'Trade reliability for introductions and office.',
        tags: ['power line', 'Tudor London', 'patronage', 'court'],
        aliases: ['noble household', 'influence'],
        source: 'Timet Curated Pack: Court and Patronage Ladders',
        priority: 10,
      ),
      const KnowledgeEntry(
        id: 'modern-victorian',
        title: 'Victorian Workshop Modern Edge',
        summary: 'Process discipline beats miracle invention in a workshop.',
        steps: ['Start with packaging, hygiene, batch control, and ledgers.'],
        contraindications: ['Do not promise electricity or engines overnight.'],
        escalation: 'Scale only after the process survives repeat batches.',
        tags: ['modern edge', 'Victorian Manchester', 'standardization'],
        aliases: ['modern methods', 'workshop'],
        source: 'Timet Curated Pack: Modern Edge That Actually Lands',
        priority: 8,
      ),
    ]);

    final fortune = await store.search(
      query: 'Regency London, a few guineas, how do I get rich first?',
      limit: 1,
    );
    final power = await store.search(
      query: 'Tudor London noble household, how do I gain influence at court?',
      limit: 1,
    );
    final modern = await store.search(
      query:
          'Victorian Manchester workshop, which modern process can become money?',
      limit: 1,
    );

    expect(fortune.first.entry.id, 'fortune-regency');
    expect(power.first.entry.id, 'power-tudor');
    expect(modern.first.entry.id, 'modern-victorian');
  });

  test(
      'knowledge store maps colloquial Chinese route queries to the right cards',
      () async {
    final store = InMemoryKnowledgeStore();
    await store.upsertAll([
      const KnowledgeEntry(
        id: 'song-fortune',
        title: '北宋汴京小本起家账房法',
        summary: '先做高频小生意、账本和信用。',
        steps: ['从纸笔、针线、茶点等高频货起步。'],
        contraindications: ['不要一开局就吹跨时代发明。'],
        escalation: '现金流稳定后再做批零结合。',
        tags: ['首富线', '北宋', '汴京', '账本'],
        aliases: ['第一桶金', '发财'],
        source: 'Timet Curated Pack: Mercantile Ladders',
        priority: 10,
      ),
      const KnowledgeEntry(
        id: 'song-survival',
        title: '南宋临安初到避坑线',
        summary: '先学称呼、钱制、礼法和稳定来路。',
        steps: ['先观察口音、称呼和银钱单位。'],
        contraindications: ['不要主动说自己来自未来。'],
        escalation: '身份稳定后再找差事和靠山。',
        tags: ['避坑线', '南宋', '临安', '礼法'],
        aliases: ['不能暴露什么', '融入'],
        source: 'Timet Curated Pack: Arrival Survival Protocols',
        priority: 10,
      ),
    ]);

    final fortune = await store.search(
      query: '我在北宋汴京有一点碎银，怎么先发财赚第一桶金',
      limit: 1,
    );
    final survival = await store.search(
      query: '我在南宋临安刚到陌生城里，最先不能暴露什么',
      limit: 1,
    );

    expect(fortune.first.entry.id, 'song-fortune');
    expect(survival.first.entry.id, 'song-survival');
  });

  test('triage uses direct route evidence hits and doomsday profile', () async {
    final knowledgeStore = InMemoryKnowledgeStore();
    await knowledgeStore.upsertAll([
      const KnowledgeEntry(
        id: 'regency-fortune',
        title: 'Regency London First Fortune Line',
        summary:
            'A literate clerk can turn clean books and discreet errands into repeat business.',
        steps: [
          'Start with copying, bookkeeping, and broker errands.',
          'Stay near coffeehouses, law offices, inns, and shopping streets.',
          'Win repeat patrons through punctual delivery and silence.',
        ],
        contraindications: ['Do not pretend to be above your references.'],
        escalation: 'Move into agency work and small credit after trust forms.',
        tags: ['fortune line', 'Regency London', 'ledger'],
        aliases: ['first fortune', 'a few guineas'],
        source: 'Timet Curated Pack: Mercantile Ladders',
        priority: 10,
      ),
    ]);

    final backend = BeaconBackend(
      knowledgeStore: knowledgeStore,
      modelRuntime: _FakeRuntime(),
      modelDownloader: _FakeDownloader(),
      meshTransport: _FakeMeshTransport(),
      bootstrapModel: const ModelDescriptor(
        id: 'gemma-e2b',
        tier: ModelTier.e2b,
        localPath: '/models/gemma-e2b.litertlm',
        isMultimodal: true,
        sizeBytes: 1024,
        sha256: 'abc',
      ),
    );

    final response = await backend.triage(
      const EmergencyRequest(
        userText:
            'Regency London, literate clerk, a few guineas, how do I build my first fortune?',
        categoryHint: 'fortune line',
        locale: 'en',
        powerMode: PowerMode.doomsday,
      ),
    );

    expect(response.isKnowledgeBacked, isTrue);
    expect(response.guidanceMode, GuidanceMode.grounded);
    expect(response.evidence.authoritative, isNotEmpty);
    expect(response.usedProfile.name, ModelProfile.e2bSaver.name);
    expect(response.steps, isNotEmpty);
  });

  test('triage still calls AI without authoritative evidence', () async {
    final runtime = _FakeRuntime();
    final backend = BeaconBackend(
      knowledgeStore: InMemoryKnowledgeStore(),
      modelRuntime: runtime,
      modelDownloader: _FakeDownloader(),
      meshTransport: _FakeMeshTransport(),
      bootstrapModel: const ModelDescriptor(
        id: 'gemma-e2b',
        tier: ModelTier.e2b,
        localPath: '/models/gemma-e2b.litertlm',
        isMultimodal: true,
        sizeBytes: 1024,
        sha256: 'abc',
      ),
    );

    final response = await backend.triage(
      const EmergencyRequest(
        userText: 'I woke up somewhere old, but I do not know the era yet.',
        locale: 'en',
      ),
    );

    expect(runtime.lastInput, isNotNull);
    expect(response.guidanceMode, GuidanceMode.grounded);
    expect(response.isKnowledgeBacked, isFalse);
    expect(response.disclaimer, contains('limited knowledge'));
    expect(response.disclaimer, contains('Timet brief'));
  });

  test('triage system prompt pins model output language from locale', () async {
    final runtime = _FakeRuntime();
    final knowledgeStore = InMemoryKnowledgeStore();
    await knowledgeStore.upsertAll([
      const KnowledgeEntry(
        id: 'tudor-power',
        title: 'Tudor London Patronage Ladder',
        summary: 'Influence comes from letters, provisions, and introductions.',
        steps: [
          'Enter a household as a clerk or discreet runner.',
          'Make yourself useful in letters and provisioning.',
          'Track who controls seals, access, and gossip.',
        ],
        contraindications: [
          'Do not discuss succession before you know the room.'
        ],
        escalation: 'Trade reliable service for patronage.',
        tags: ['power line', 'Tudor London', 'court', 'patronage'],
        aliases: ['noble household', 'influence'],
        source: 'Timet Curated Pack: Court and Patronage Ladders',
        priority: 10,
      ),
    ]);
    final backend = BeaconBackend(
      knowledgeStore: knowledgeStore,
      modelRuntime: runtime,
      modelDownloader: _FakeDownloader(),
      meshTransport: _FakeMeshTransport(),
      bootstrapModel: const ModelDescriptor(
        id: 'gemma-e2b',
        tier: ModelTier.e2b,
        localPath: '/models/gemma-e2b.litertlm',
        isMultimodal: true,
        sizeBytes: 1024,
        sha256: 'abc',
      ),
    );

    await backend.triage(
      const EmergencyRequest(
        userText:
            'Tudor London, I serve in a noble household. How do I gain influence?',
        categoryHint: 'power line',
        locale: 'ja',
      ),
    );

    expect(runtime.lastInput, isNotNull);
    expect(runtime.lastInput!.systemPrompt, contains('Japanese'));
    expect(runtime.lastInput!.systemPrompt, contains('ja'));
  });

  test(
      'triage reset starts a new logical session without unloading the hot model',
      () async {
    final runtime = _FakeRuntime();
    final backend = BeaconBackend(
      knowledgeStore: InMemoryKnowledgeStore(),
      modelRuntime: runtime,
      modelDownloader: _FakeDownloader(),
      meshTransport: _FakeMeshTransport(),
      bootstrapModel: const ModelDescriptor(
        id: 'gemma-e2b',
        tier: ModelTier.e2b,
        localPath: '/models/gemma-e2b.litertlm',
        isMultimodal: true,
        sizeBytes: 1024,
        sha256: 'abc',
      ),
    );

    await backend.triage(
      const EmergencyRequest(
        userText: 'First session request.',
        locale: 'en',
        sessionId: 'session-a',
      ),
    );

    await backend.triage(
      const EmergencyRequest(
        userText: 'Second session after clear.',
        locale: 'en',
        sessionId: 'session-b',
        resetContext: true,
      ),
    );

    expect(runtime.loadCount, 1);
    expect(runtime.unloadCount, 0);
    expect(runtime.lastInput, isNotNull);
    expect(runtime.lastInput!.sessionId, 'session-b');
    expect(runtime.lastInput!.resetContext, isTrue);
    expect(runtime.lastInput!.userPrompt, contains('SESSION_RESET: true'));
  });

  test('legacy sos packet broadcasts with hop metadata', () async {
    final backend = BeaconBackend(
      knowledgeStore: InMemoryKnowledgeStore(),
      modelRuntime: _FakeRuntime(),
      modelDownloader: _FakeDownloader(),
      meshTransport: _FakeMeshTransport(),
      bootstrapModel: const ModelDescriptor(
        id: 'gemma-e2b',
        tier: ModelTier.e2b,
        localPath: '/models/gemma-e2b.litertlm',
        isMultimodal: true,
        sizeBytes: 1024,
        sha256: 'abc',
      ),
    );

    final result = await backend.broadcastSos(
      senderId: 'node-a',
      location: const GeoPoint(latitude: 30.2741, longitude: 120.1551),
      brief: 'Legacy local broadcast capability retained outside the V1 UI.',
    );

    expect(result.packet.canRelay, isTrue);
    expect(result.deliveredToPeers, 2);
  });
}

class _FakeRuntime implements ModelRuntime {
  String? _loadedModelId;
  ModelInferenceInput? lastInput;
  int loadCount = 0;
  int unloadCount = 0;

  @override
  Future<ModelInferenceOutput> infer(ModelInferenceInput input) async {
    lastInput = input;
    return const ModelInferenceOutput(
      text:
          '1. Current Read: start with trust and repeat business.\n2. First Three Moves: copy, keep books, and run discreet errands.\n3. Riches / Power Path: become a reliable agent before scaling credit.',
      tokenCount: 42,
    );
  }

  @override
  Future<bool> isLoaded(String modelId) async => _loadedModelId == modelId;

  @override
  Future<void> load(ModelDescriptor descriptor) async {
    _loadedModelId = descriptor.id;
    loadCount++;
  }

  @override
  Future<void> unload() async {
    _loadedModelId = null;
    unloadCount++;
  }
}

class _FakeDownloader implements ModelDownloader {
  @override
  Stream<DownloadProgress> download(Uri uri, String outputPath,
      {int? resumeFrom}) {
    return Stream<DownloadProgress>.fromIterable([
      DownloadProgress(
          receivedBytes: 50, totalBytes: 100, isResumed: resumeFrom != null),
      DownloadProgress(
          receivedBytes: 100, totalBytes: 100, isResumed: resumeFrom != null),
    ]);
  }
}

class _FakeMeshTransport implements MeshTransport {
  @override
  Future<int> broadcast(SosPacket packet) async => 2;
}
