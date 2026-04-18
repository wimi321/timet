import { SUPPORTED_LANGUAGES, type LanguageCode } from './languages';
import { BRAND } from '../lib/brand';

export type TranslationKey =
  | 'language.selection'
  | 'header.title'
  | 'status.offline_ready'
  | 'battery.unknown'
  | 'battery.level'
  | 'warning.battery_low'
  | 'power.doomsday.active'
  | 'power.doomsday.toggle'
  | 'power.normal.active'
  | 'power.normal.toggle'
  | 'hero.kicker'
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.input_rule'
  | 'hero.default_rule'
  | 'hero.example_title'
  | 'hero.example_query'
  | 'route.wealth.label'
  | 'route.wealth.text'
  | 'route.power.label'
  | 'route.power.text'
  | 'route.survival.label'
  | 'route.survival.text'
  | 'route.tech.label'
  | 'route.tech.text'
  | 'action.visual_help'
  | 'action.import_photo'
  | 'action.clear_chat'
  | 'camera.prompt1'
  | 'camera.prompt2'
  | 'camera.cancel'
  | 'camera.capture_aria'
  | 'chat.input_placeholder'
  | 'chat.send'
  | 'chat.streaming'
  | 'model.manage'
  | 'model.not_loaded'
  | 'model.close'
  | 'model.downloading'
  | 'model.loaded_tag'
  | 'model.preparing'
  | 'model.switch_btn'
  | 'model.download_btn'
  | 'model.size_e2b'
  | 'model.size_e4b'
  | 'badge.authoritative'
  | 'evidence.source'
  | 'error.generic'
  | 'status.inferring'
  | 'status.evidence_hit'
  | 'status.model_responded'
  | 'status.model_required'
  | 'status.model_preparing'
  | 'status.infer_failed'
  | 'status.visual_evidence'
  | 'status.visual_done'
  | 'status.doomsday_on'
  | 'status.standard_power'
  | 'status.downloading'
  | 'status.download_done'
  | 'status.model_switched'
  | 'status.context_required'
  | 'disclaimer.authoritative'
  | 'disclaimer.limited_evidence'
  | 'system.visual_request'
  | 'system.message_prefix'
  | 'system.context_prompt'
  | 'response.current_read'
  | 'response.first_moves'
  | 'response.main_path'
  | 'response.do_not_expose'
  | 'response.ask_next';

const enDict: Record<TranslationKey, string> = {
  'language.selection': 'Language selection',
  'header.title': BRAND.shortName,
  'status.offline_ready': 'Timet strategist ready',
  'battery.unknown': 'Battery unknown',
  'battery.level': 'Battery {level}%',
  'warning.battery_low': 'Battery is critically low. Timet has switched to extreme saving mode.',
  'power.doomsday.active': 'Extreme saving on',
  'power.doomsday.toggle': 'Enable extreme saving',
  'power.normal.active': 'Standard runtime',
  'power.normal.toggle': 'Restore standard runtime',
  'hero.kicker': 'TIME-TRAVEL STRATEGY ASSISTANT',
  'hero.title': 'Name the era. Take the first fortune.',
  'hero.subtitle': 'Tell Timet the era, place, identity, resources, and goal. It will draft your wealth line or power line.',
  'hero.input_rule': 'Prompt formula: era + place + identity + resources + goal',
  'hero.default_rule': 'Default rule: Timet prioritizes the fortune line unless you clearly ask for power.',
  'hero.example_title': 'Good prompt example',
  'hero.example_query': 'Late Qing Shanghai, basic literacy, little silver, I want wealth and influence fast. What is the first path?',
  'route.wealth.label': 'Fortune Line',
  'route.wealth.text': 'I am in a functioning market society and want the fastest realistic path to my first fortune.',
  'route.power.label': 'Power Line',
  'route.power.text': 'I am already near a court, faction, office, guild, or army. Show me how to rise without getting crushed.',
  'route.survival.label': 'Fatal Mistakes',
  'route.survival.text': 'I just arrived in an unfamiliar era. Tell me how to blend in fast and avoid lethal mistakes.',
  'route.tech.label': 'Modern Edge',
  'route.tech.text': 'I know some modern methods. Show me which ones can turn into a real advantage in this era.',
  'action.visual_help': 'Scan Coin / Script / Tool',
  'action.import_photo': 'Import image',
  'action.clear_chat': 'Return home',
  'camera.prompt1': 'Place the coin, script, tool, seal, garment, or device detail inside the frame.',
  'camera.prompt2': 'Timet will inspect visible clues and suggest what to ask next, what to imitate, and what not to reveal.',
  'camera.cancel': 'Cancel',
  'camera.capture_aria': 'Capture',
  'chat.input_placeholder': 'Example: Late Qing Shanghai, small trader, little silver, show me the first fortune line...',
  'chat.send': 'Ask',
  'chat.streaming': 'Drafting your route...',
  'model.manage': 'Settings',
  'model.not_loaded': 'No local strategist model loaded',
  'model.close': 'Close',
  'model.downloading': 'Downloading {progress}%',
  'model.loaded_tag': 'Loaded',
  'model.preparing': 'Preparing the built-in Timet strategist model',
  'model.switch_btn': 'Switch to this model',
  'model.download_btn': 'Download and switch',
  'model.size_e2b': '2B / Strategy baseline',
  'model.size_e4b': '4B / High-context route planner',
  'badge.authoritative': 'Route evidence hit',
  'evidence.source': 'Source trail',
  'error.generic': 'Error: {message}',
  'status.inferring': 'Drafting locally',
  'status.evidence_hit': 'Route grounded in the local pack',
  'status.model_responded': 'Timet has a route ready',
  'status.model_required': 'Download a local strategist model in Settings before asking Timet for a route.',
  'status.model_preparing': 'Preparing the built-in Timet strategist model for first launch. Keep the app open.',
  'status.infer_failed': 'Route drafting failed',
  'status.visual_evidence': 'Visual clue scan grounded in the local pack',
  'status.visual_done': 'Visual clue scan ready',
  'status.doomsday_on': 'Extreme saving enabled',
  'status.standard_power': 'Standard runtime restored',
  'status.downloading': 'Downloading {modelId}',
  'status.download_done': '{modelId} downloaded, switching now',
  'status.model_switched': 'Model switch complete',
  'status.context_required': 'Need era and place',
  'disclaimer.authoritative': 'This route is grounded in the local Timet knowledge pack. Use it as a strategist brief, not a prophecy.',
  'disclaimer.limited_evidence': 'This route is a best-effort strategist brief from the local model. Ask again with more era, place, and resource detail.',
  'system.visual_request': '[Scan request: Timet will inspect the visible clue and suggest your next move.]',
  'system.message_prefix': 'Timet Strategist',
  'system.context_prompt': 'Tell me the era, place, identity, resources, and target first.',
  'response.current_read': 'Current Read',
  'response.first_moves': 'First Three Moves',
  'response.main_path': 'Riches / Power Path',
  'response.do_not_expose': 'Do Not Expose',
  'response.ask_next': 'Ask Me Next',
};

const zhCnDict: Partial<Record<TranslationKey, string>> = {
  'language.selection': '语言选择',
  'header.title': BRAND.fullName,
  'status.offline_ready': 'Timet 军师已就绪',
  'battery.unknown': '电量未知',
  'battery.level': '电量 {level}%',
  'warning.battery_low': '当前电量极低，Timet 已切换到极限省电模式。',
  'power.doomsday.active': '极限省电中',
  'power.doomsday.toggle': '切到极限省电',
  'power.normal.active': '标准算力',
  'power.normal.toggle': '恢复标准算力',
  'hero.kicker': '给穿越者用的时空军师',
  'hero.title': '报上时代，我来给你第一条登顶路线。',
  'hero.subtitle': '直接告诉 Timet：时代、地点、身份、资源、目标。它会先给你首富线，再给你上位线。',
  'hero.input_rule': '提问公式：时代 + 地点 + 身份 + 资源 + 目标',
  'hero.default_rule': '默认规则：Timet 会先给首富线；你要上位，就直接在问题里说。',
  'hero.example_title': '推荐提问',
  'hero.example_query': '我在北宋汴京，识字，有一点碎银，想先发财再结交权贵，第一步怎么走？',
  'route.wealth.label': '首富线',
  'route.wealth.text': '我在一个有基本市镇秩序的时代，想从小本生意做出第一桶金。',
  'route.power.label': '上位线',
  'route.power.text': '我已经靠近官场、军中、豪门、商帮或宫廷边缘，怎样先立足再上位？',
  'route.survival.label': '避坑线',
  'route.survival.text': '我刚穿到陌生时代，先告诉我哪些话不能说，哪些事绝不能做。',
  'route.tech.label': '现代知识外挂',
  'route.tech.text': '我掌握一些现代知识，怎样把它变成这个时代真能落地的优势？',
  'action.visual_help': '扫描钱币 / 文字 / 器物',
  'action.import_photo': '从相册导入',
  'action.clear_chat': '返回首页',
  'camera.prompt1': '请把钱币、文字、器物、印章、衣料或关键细节放进画面里。',
  'camera.prompt2': 'Timet 会根据可见线索告诉你下一步该问什么、该学什么、绝不能暴露什么。',
  'camera.cancel': '取消',
  'camera.capture_aria': '拍摄',
  'chat.input_placeholder': '例如：我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？',
  'chat.send': '发问',
  'chat.streaming': '正在推演路线...',
  'model.manage': '设置与模型',
  'model.not_loaded': '未加载本地军师模型',
  'model.close': '关闭',
  'model.downloading': '下载中 {progress}%',
  'model.loaded_tag': '已加载',
  'model.preparing': '内置 Timet 军师模型准备中',
  'model.switch_btn': '切换到此模型',
  'model.download_btn': '下载并切换',
  'model.size_e2b': '2B / 军师保底模型',
  'model.size_e4b': '4B / 高上下文路线规划',
  'badge.authoritative': '已命中路线证据',
  'evidence.source': '路线来源',
  'error.generic': '错误：{message}',
  'status.inferring': '本地推演中',
  'status.evidence_hit': '已命中本地路线包',
  'status.model_responded': 'Timet 已给出路线',
  'status.model_required': '请先在设置中下载本地军师模型，再向 Timet 发问。',
  'status.model_preparing': '正在为首次启动准备 Timet 内置军师模型，请保持应用开启。',
  'status.infer_failed': '路线推演失败',
  'status.visual_evidence': '线索扫描已命中本地路线包',
  'status.visual_done': '线索扫描完成',
  'status.doomsday_on': '极限省电模式已启用',
  'status.standard_power': '标准算力模式已恢复',
  'status.downloading': '正在下载 {modelId}',
  'status.download_done': '{modelId} 下载完成，正在切换',
  'status.model_switched': '模型切换完成',
  'status.context_required': '需要时代和地点',
  'disclaimer.authoritative': '这条路线命中了本地 Timet 路线包，可把它当作军师札记，不要当神谕照抄。',
  'disclaimer.limited_evidence': '这条路线由本地模型尽力推演而成。把时代、地点、身份和资源说得更清楚，Timet 才能给得更准。',
  'system.visual_request': '[线索扫描：Timet 将检查画面里的钱币、文字、器物或服饰细节，并给出下一步。]',
  'system.message_prefix': 'Timet 军师',
  'system.context_prompt': '先把时代、地点、身份、资源和目标告诉我。',
  'response.current_read': '局面判断',
  'response.first_moves': '先走三步',
  'response.main_path': '发财 / 上位主路径',
  'response.do_not_expose': '绝不能暴露的事',
  'response.ask_next': '你下一句该问什么',
};

const zhTwDict: Partial<Record<TranslationKey, string>> = {
  'header.title': BRAND.fullName,
  'status.offline_ready': 'Timet 軍師已就緒',
  'hero.kicker': '給穿越者用的時空軍師',
  'hero.title': '先報上時代，我來給你第一條登頂路線。',
  'hero.subtitle': '直接告訴 Timet：時代、地點、身份、資源、目標。它會先給你首富線，再給你上位線。',
  'hero.input_rule': '提問公式：時代 + 地點 + 身份 + 資源 + 目標',
  'hero.default_rule': '預設規則：Timet 會先給首富線；你要上位，就直接在問題裡說。',
  'hero.example_title': '推薦提問',
  'hero.example_query': '我在北宋汴京，識字，有一點碎銀，想先發財再結交權貴，第一步怎麼走？',
  'route.wealth.label': '首富線',
  'route.power.label': '上位線',
  'route.survival.label': '避坑線',
  'route.tech.label': '現代知識外掛',
  'action.visual_help': '掃描錢幣 / 文字 / 器物',
  'chat.input_placeholder': '例如：我在北宋汴京，識字，有一點碎銀，怎麼三個月賺到第一桶金？',
  'chat.send': '發問',
  'model.manage': '設定與模型',
  'system.message_prefix': 'Timet 軍師',
  'response.current_read': '局面判斷',
  'response.first_moves': '先走三步',
  'response.main_path': '發財 / 上位主路徑',
  'response.do_not_expose': '絕不能暴露的事',
  'response.ask_next': '你下一句該問什麼',
};

const localeOverrides: Partial<Record<LanguageCode, Partial<Record<TranslationKey, string>>>> = {
  'zh-CN': zhCnDict,
  'zh-TW': zhTwDict,
};

export const messages = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((language) => [
    language.code,
    {
      ...enDict,
      ...(localeOverrides[language.code] ?? {}),
    },
  ]),
) as Record<LanguageCode, Record<TranslationKey, string>>;
