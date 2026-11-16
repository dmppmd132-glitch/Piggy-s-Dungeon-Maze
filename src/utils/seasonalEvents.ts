import type { ActiveSeasonalQuest, CalendarSeasonId } from '../types/game';

export interface SeasonalFestivalTemplate {
  id: string;
  seasonId: CalendarSeasonId;
  seasonLabel: string;
  title: string;
  description: string;
  targetItem: string;
  targetKeywords: string[];
  clueHint: string;
  durationTurns: number;
  rewardCoins: number;
  rewardItem: string;
  rewardTrufflePoints: number;
}

export const SEASONAL_FESTIVAL_BY_SEASON: Record<CalendarSeasonId, SeasonalFestivalTemplate> = {
  spring: {
    id: 'spring_sprout_picnic',
    seasonId: 'spring',
    seasonLabel: '春季限定（3–5月）',
    title: '春泥嫩芽野餐祭',
    description:
      '春風吹醒了泥巴王國！村莊正舉辦野餐慶典，大家急尋鮮甜的「晨露嫩松露芽」來點綴春泥三明治。',
    targetItem: '晨露嫩松露芽',
    targetKeywords: ['嫩松露芽', '松露芽', '嫩芽', '春芽'],
    clueHint: '在春雨潤澤的泥沼草叢尋找晨露嫩松露芽',
    durationTurns: 5,
    rewardCoins: 65,
    rewardItem: '春日花冠護符',
    rewardTrufflePoints: 10,
  },
  summer: {
    id: 'summer_melon_splash',
    seasonId: 'summer',
    seasonLabel: '夏季限定（6–8月）',
    title: '夏日冰泉西瓜大會',
    description:
      '酷熱盛夏來襲！泥巴村莊舉辦清涼消暑祭，誰能抱回傳說中的「冰鎮森林野西瓜」，就能贏得冰晶大賞！',
    targetItem: '冰鎮森林野西瓜',
    targetKeywords: ['野西瓜', '西瓜', '冰西瓜'],
    clueHint: '沿著清涼森林溪流尋找冰鎮森林野西瓜',
    durationTurns: 5,
    rewardCoins: 70,
    rewardItem: '消暑冰晶湯匙',
    rewardTrufflePoints: 10,
  },
  autumn: {
    id: 'autumn_truffle_harvest',
    seasonId: 'autumn',
    seasonLabel: '秋季限定（9–11月）',
    title: '金秋松露豐收祭',
    description:
      '秋楓飄落、松露飄香！泥巴王國正在慶祝豐收季，村長懸賞尋找香氣四溢的「秋日金黃松露餅」當慶典壓軸！',
    targetItem: '秋日金黃松露餅',
    targetKeywords: ['金黃松露餅', '松露餅', '豐收餅'],
    clueHint: '前往秋楓老橡樹下翻找落葉裡的秋日金黃松露餅',
    durationTurns: 5,
    rewardCoins: 75,
    rewardItem: '豐收金箔鍋蓋',
    rewardTrufflePoints: 12,
  },
  winter: {
    id: 'winter_hotpot_festival',
    seasonId: 'winter',
    seasonLabel: '冬季限定（12–2月）',
    title: '暖暖火鍋祭',
    description:
      '寒風呼呼吹過泥巴王國！哥布林與動物們架起了巨無霸湯鍋，正四處徵求秘製「傳說辣味火鍋底料」！',
    targetItem: '傳說辣味火鍋底料',
    targetKeywords: ['火鍋底料', '辣味火鍋', '底料', '火鍋'],
    clueHint: '到雪地溫泉旁向哥布林攤販打聽傳說辣味火鍋底料',
    durationTurns: 5,
    rewardCoins: 80,
    rewardItem: '暖冬椒麻湯匙',
    rewardTrufflePoints: 12,
  },
};

export function getCalendarSeasonFromDate(date: Date = new Date()): CalendarSeasonId {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function getCurrentSeasonalFestivalTemplate(
  date: Date = new Date()
): SeasonalFestivalTemplate {
  const season = getCalendarSeasonFromDate(date);
  return SEASONAL_FESTIVAL_BY_SEASON[season];
}

export function createActiveSeasonalQuest(
  startTurn: number,
  date: Date = new Date()
): ActiveSeasonalQuest {
  const template = getCurrentSeasonalFestivalTemplate(date);
  return {
    id: template.id,
    seasonId: template.seasonId,
    seasonLabel: template.seasonLabel,
    title: template.title,
    description: template.description,
    targetItem: template.targetItem,
    targetKeywords: template.targetKeywords,
    clueHint: template.clueHint,
    startTurn,
    expiresAtTurn: startTurn + template.durationTurns,
    rewardCoins: template.rewardCoins,
    rewardItem: template.rewardItem,
    rewardTrufflePoints: template.rewardTrufflePoints,
  };
}

export function matchesSeasonalTargetItem(
  itemName: string,
  quest: ActiveSeasonalQuest
): boolean {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === quest.targetItem.toLowerCase()) return true;
  return quest.targetKeywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

export function findSeasonalTargetIndex(
  inventory: string[],
  quest: ActiveSeasonalQuest | null
): number {
  if (!quest) return -1;
  return inventory.findIndex((item) => matchesSeasonalTargetItem(item, quest));
}

export function isSeasonalSearchAction(
  action: string,
  quest: ActiveSeasonalQuest | null
): boolean {
  if (!quest) return false;
  const text = action.trim().toLowerCase();
  if (!text) return false;
  if (
    text.includes(quest.targetItem.toLowerCase()) ||
    text.includes(quest.clueHint.toLowerCase()) ||
    text.includes(quest.title.toLowerCase()) ||
    text.includes('節慶') ||
    text.includes('祭典')
  ) {
    return true;
  }
  return quest.targetKeywords.some((kw) => text.includes(kw.toLowerCase()));
}

export function isSeasonalDeliveryAction(
  action: string,
  quest: ActiveSeasonalQuest | null
): boolean {
  if (!quest) return false;
  const text = action.trim().toLowerCase();
  if (!text) return false;
  const hasDeliverVerb =
    text.includes('交付') ||
    text.includes('交給') ||
    text.includes('參加') ||
    text.includes('領賞') ||
    text.includes('獻上') ||
    text.includes('完成');
  const mentionsFestival =
    text.includes(quest.title.toLowerCase()) ||
    text.includes(quest.targetItem.toLowerCase()) ||
    text.includes('節慶') ||
    quest.targetKeywords.some((kw) => text.includes(kw.toLowerCase()));
  return hasDeliverVerb && mentionsFestival;
}

export function normalizeActiveSeasonalQuest(raw: unknown): ActiveSeasonalQuest | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<ActiveSeasonalQuest>;
  if (
    typeof obj.id !== 'string' ||
    typeof obj.title !== 'string' ||
    typeof obj.targetItem !== 'string' ||
    typeof obj.expiresAtTurn !== 'number'
  ) {
    return null;
  }
  return {
    id: obj.id,
    seasonId: obj.seasonId ?? 'autumn',
    seasonLabel: typeof obj.seasonLabel === 'string' ? obj.seasonLabel : '季節限定',
    title: obj.title,
    description: typeof obj.description === 'string' ? obj.description : '',
    targetItem: obj.targetItem,
    targetKeywords: Array.isArray(obj.targetKeywords) ? obj.targetKeywords : [obj.targetItem],
    clueHint: typeof obj.clueHint === 'string' ? obj.clueHint : '',
    startTurn: typeof obj.startTurn === 'number' ? obj.startTurn : 1,
    expiresAtTurn: obj.expiresAtTurn,
    rewardCoins: typeof obj.rewardCoins === 'number' ? obj.rewardCoins : 70,
    rewardItem: typeof obj.rewardItem === 'string' ? obj.rewardItem : '慶典紀念護符',
    rewardTrufflePoints:
      typeof obj.rewardTrufflePoints === 'number' ? obj.rewardTrufflePoints : 10,
  };
}
