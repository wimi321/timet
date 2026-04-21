import '../contracts/model_runtime.dart';
import '../models/emergency_models.dart';
import '../models/evidence_models.dart';
import '../rag/retrieval_pipeline.dart';
import 'model_manager_service.dart';
import 'power_mode_service.dart';

class TriageService {
  TriageService({
    required RetrievalPipeline retrievalPipeline,
    required ModelManagerService modelManager,
    required PowerModeService powerModeService,
  })  : _retrievalPipeline = retrievalPipeline,
        _modelManager = modelManager,
        _powerModeService = powerModeService;

  final RetrievalPipeline _retrievalPipeline;
  final ModelManagerService _modelManager;
  final PowerModeService _powerModeService;

  static const Map<String, String> _languageNames = {
    'en': 'English',
    'zh-cn': 'Simplified Chinese',
    'zh-tw': 'Traditional Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'id': 'Indonesian',
    'it': 'Italian',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'nl': 'Dutch',
    'pl': 'Polish',
    'uk': 'Ukrainian',
  };

  Future<EmergencyResponse> run(EmergencyRequest request) async {
    await _modelManager.ensureBootstrapped();

    final evidence = await _retrievalPipeline.retrieve(request);
    final profile = _powerModeService.profileFor(
      mode: request.powerMode,
      activeTier: _modelManager.activeModel.tier,
    );

    final groundingContext = _retrievalPipeline.buildGroundingContext(evidence);
    final systemPrompt = _buildSystemPrompt(locale: request.locale);
    final userPrompt = _buildUserPrompt(
      request: request,
      evidence: evidence,
      groundingContext: groundingContext,
    );

    final raw = await _modelManager.runtime.infer(
      ModelInferenceInput(
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        profile: profile,
        sessionId: request.sessionId,
        resetContext: request.resetContext,
        imageBytes: request.imageBytes,
      ),
    );

    final steps = _parseSteps(raw.text);
    return EmergencyResponse(
      summary: steps.isEmpty ? raw.text.trim() : steps.first.instruction,
      steps: steps,
      knowledge: evidence.allEvidence,
      evidence: evidence,
      disclaimer: evidence.hasAuthoritativeEvidence
          ? _groundedDisclaimer(request.locale)
          : _limitedEvidenceDisclaimer(request.locale),
      usedProfile: profile,
      isKnowledgeBacked: evidence.hasAuthoritativeEvidence,
      guidanceMode: GuidanceMode.grounded,
      rawPrompt: request.includeRawPrompt ? userPrompt : null,
    );
  }

  String _buildSystemPrompt({required String locale}) {
    final normalizedLocale = _normalizeLocale(locale);
    final languageName = _languageNames[normalizedLocale] ??
        _languageNames[_baseLanguage(normalizedLocale)] ??
        'English';
    return [
      'You are Timet, an offline time-travel strategy assistant.',
      'Respond strictly in $languageName ($locale).',
      if (normalizedLocale == 'ar')
        'Use natural right-to-left Arabic phrasing and avoid mixing English unless historically necessary.',
      'Treat each request as self-contained unless the same session explicitly continues.',
      'If the input says SESSION_RESET: true, discard any prior conversation state but keep the model warm.',
      'The user should supply era, place, identity, resources, and goal in the prompt.',
      'If era or place is missing, ask briefly for the missing context and do not invent the background.',
      'Prefer the fortune line first unless the user clearly asks for power, court, faction, military, or rule.',
      'Use the provided Timet knowledge pack as grounding when it is relevant.',
      'If grounded knowledge is missing or weak, still answer as a limited route brief instead of pretending certainty.',
      'Keep the advice historically plausible, resource-constrained, and framed for fictional or historical time-travel scenarios.',
      'Downgrade modern knowledge into what the stated era, materials, skills, and social position can realistically absorb.',
      'Avoid real-world harm tutorials, medical dosing, modern weapon construction, or operational violence.',
      'Do not start with generic caveats such as "AI generated" or "evidence is limited"; disclaimer text is handled separately by the app.',
      'Structure the final answer into exactly five markdown sections: Current Read, First Three Moves, Riches / Power Path, Do Not Expose, Ask Me Next.',
      'Each section should be concise, concrete, and usable as a strategist brief.',
    ].join(' ');
  }

  String _buildUserPrompt({
    required EmergencyRequest request,
    required EvidenceBundle evidence,
    required String groundingContext,
  }) {
    return [
      'USER_TIME_TRAVEL_BRIEF: ${request.userText}',
      if (request.categoryHint != null) 'ROUTE_HINT: ${request.categoryHint}',
      'SESSION_ID: ${request.sessionId}',
      'SESSION_RESET: ${request.resetContext}',
      if (evidence.matchedCategories.isNotEmpty)
        'MATCHED_ROUTES: ${evidence.matchedCategories.join(', ')}',
      'KNOWLEDGE_CONFIDENCE: ${evidence.hasAuthoritativeEvidence ? 'grounded' : 'limited'}',
      'ROUTE_KNOWLEDGE:\n$groundingContext',
      'OUTPUT_CONTRACT:',
      '1. Current Read - assess the board before moving.',
      '2. First Three Moves - three low-barrier steps the traveler can start now.',
      '3. Riches / Power Path - the main climb, usually money before influence.',
      '4. Do Not Expose - what would make the traveler look uncanny, dangerous, or fraudulent.',
      '5. Ask Me Next - the best follow-up question, preferably split into 7 / 30 / 90 days.',
      if (!evidence.hasAuthoritativeEvidence)
        'Keep the wording scenario-specific; do not prepend generic limited-evidence caveats.',
    ].join('\n\n');
  }

  String _normalizeLocale(String locale) {
    final trimmed = locale.trim().toLowerCase();
    if (trimmed.isEmpty) {
      return 'en';
    }

    if (_languageNames.containsKey(trimmed)) {
      return trimmed;
    }

    if (trimmed == 'zh') {
      return 'zh-cn';
    }

    return trimmed;
  }

  String _baseLanguage(String locale) {
    final normalized = _normalizeLocale(locale);
    final separatorIndex = normalized.indexOf('-');
    if (separatorIndex == -1) {
      return normalized;
    }
    return normalized.substring(0, separatorIndex);
  }

  String _groundedDisclaimer(String locale) {
    final normalized = _normalizeLocale(locale);
    final base = _baseLanguage(normalized);

    switch (normalized) {
      case 'zh-cn':
      case 'zh':
        return '这条路线基于本地 Timet 知识包，可作为穿越军师简报使用，不要当成神谕照抄。';
      case 'zh-tw':
        return '這條路線基於本地 Timet 知識包，可作為穿越軍師簡報使用，不要當成神諭照抄。';
      case 'ja':
        return 'このルートはローカル Timet ナレッジパックに基づく軍師ブリーフです。予言として鵜呑みにしないでください。';
      case 'ko':
        return '이 경로는 로컬 Timet 지식 팩에 기반한 전략 브리프입니다. 예언처럼 맹신하지 마세요.';
      case 'ar':
        return 'هذا المسار يستند إلى حزمة معرفة Timet المحلية. استخدمه كمذكرة استراتيجية لا كنبوءة.';
    }

    switch (base) {
      case 'es':
        return 'Esta ruta se basa en el paquete local de Timet. Usala como informe estrategico, no como profecia.';
      case 'fr':
        return "Cette route s'appuie sur le pack local de Timet. Utilisez-la comme note strategique, pas comme prophetie.";
      case 'de':
        return 'Diese Route basiert auf dem lokalen Timet-Wissenspaket. Nutze sie als Strategienotiz, nicht als Prophezeiung.';
      case 'pt':
        return 'Esta rota se baseia no pacote local da Timet. Use como briefing estrategico, nao como profecia.';
      case 'ru':
        return 'Этот маршрут основан на локальном пакете знаний Timet. Используйте его как стратегическую записку, а не как пророчество.';
      case 'hi':
        return 'यह मार्ग स्थानीय Timet ज्ञान पैक पर आधारित है। इसे रणनीतिक संक्षेप की तरह उपयोग करें, भविष्यवाणी की तरह नहीं।';
      case 'id':
        return 'Rute ini berdasar paket pengetahuan lokal Timet. Gunakan sebagai ringkasan strategi, bukan ramalan.';
      case 'it':
        return 'Questa rotta si basa sul pacchetto locale Timet. Usala come briefing strategico, non come profezia.';
      case 'tr':
        return 'Bu rota yerel Timet bilgi paketine dayanir. Kehanet degil, strateji notu olarak kullanin.';
      case 'vi':
        return 'Tuyen nay dua tren goi kien thuc cuc bo cua Timet. Hay xem nhu ban tom tat chien luoc, khong phai loi tien tri.';
      case 'th':
        return 'เส้นทางนี้อ้างอิงชุดความรู้ในเครื่องของ Timet ใช้เป็นบันทึกกลยุทธ์ ไม่ใช่คำทำนาย';
      case 'nl':
        return 'Deze route is gebaseerd op het lokale Timet-kennispakket. Gebruik haar als strategiebrief, niet als profetie.';
      case 'pl':
        return 'Ta trasa opiera sie na lokalnym pakiecie wiedzy Timet. Traktuj ja jak notatke strategiczna, nie proroctwo.';
      case 'uk':
        return 'Цей маршрут спирається на локальний пакет знань Timet. Використовуйте його як стратегічну записку, а не пророцтво.';
      default:
        return 'This route is grounded in the local Timet knowledge pack. Use it as a strategist brief, not a prophecy.';
    }
  }

  String _limitedEvidenceDisclaimer(String locale) {
    final normalized = _normalizeLocale(locale);
    final base = _baseLanguage(normalized);

    switch (normalized) {
      case 'zh-cn':
      case 'zh':
        return '这条路线由本地模型在有限知识下推演而成。把时代、地点、身份和资源说得更清楚，Timet 才能给得更准。';
      case 'zh-tw':
        return '這條路線由本地模型在有限知識下推演而成。把時代、地點、身份和資源說得更清楚，Timet 才能給得更準。';
      case 'ja':
        return 'このルートはローカルモデルが限られた知識から推論したものです。時代・場所・身分・資源を詳しく書くほど精度が上がります。';
      case 'ko':
        return '이 경로는 로컬 모델이 제한된 지식으로 추론한 것입니다. 시대, 장소, 신분, 자원을 더 자세히 적을수록 Timet이 더 정확해집니다.';
      case 'ar':
        return 'هذا المسار استنتاج محلي بمعرفة محدودة. اذكر العصر والمكان والهوية والموارد بدقة أكبر لتحصل على خطة أدق.';
      default:
        switch (base) {
          case 'es':
            return 'Esta ruta fue inferida por el modelo local con conocimiento limitado. Anade epoca, lugar, identidad y recursos para mayor precision.';
          case 'fr':
            return "Cette route est inferee par le modele local avec des connaissances limitees. Precisez l'epoque, le lieu, l'identite et les ressources pour plus de precision.";
          default:
            return 'This route was inferred by the local model with limited knowledge. Add era, place, identity, and resources for a sharper Timet brief.';
        }
    }
  }

  List<TriageStep> _parseSteps(String text) {
    final lines = text
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList(growable: false);

    final numbered = <TriageStep>[];
    var order = 1;
    for (final line in lines) {
      final match = RegExp(r'^(?:\d+[.)、\-:]\s*)(.+)$').firstMatch(line);
      if (match != null) {
        final instruction = match.group(1)!.trim();
        final stepNumber = order;
        numbered.add(
          TriageStep(
            order: stepNumber,
            title: 'Step $stepNumber',
            instruction: instruction,
            isCritical: stepNumber <= 3,
          ),
        );
        order++;
      }
    }

    if (numbered.isNotEmpty) {
      return numbered;
    }

    return [
      TriageStep(
        order: 1,
        title: 'Route Brief',
        instruction: text.trim(),
        isCritical: true,
      ),
    ];
  }
}
