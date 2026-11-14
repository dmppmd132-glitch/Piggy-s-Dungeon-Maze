export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDayId = 'dawn' | 'day' | 'dusk' | 'night';

export interface WorldCycleModifiers {
  visibilityLabel: string;
  monsterRiskLabel: string;
  monsterEncounterRate: number;
  surpriseChanceBonus: number;
  extraHungerDrain: number;
}

export interface WorldCycleState {
  day: number;
  seasonId: SeasonId;
  seasonName: string;
  timeId: TimeOfDayId;
  timeName: string;
  shortStatus: string;
  effectSummary: string;
  modifiers: WorldCycleModifiers;
  dmDirective: string;
}

interface SeasonConfig {
  id: SeasonId;
  name: string;
  summary: string;
  monsterRateBonus: number;
  surpriseBonus: number;
  extraDrain: number;
  dmFlavor: string;
}

interface TimeConfig {
  id: TimeOfDayId;
  name: string;
  visibilityLabel: string;
  monsterRiskLabel: string;
  monsterRate: number;
  surpriseBonus: number;
  extraDrain: number;
  dmFlavor: string;
}

const SEASONS: SeasonConfig[] = [
  {
    id: 'spring',
    name: '春季',
    summary: '草木茂盛 · 路邊補給多',
    monsterRateBonus: 0,
    surpriseBonus: 0.08,
    extraDrain: 0,
    dmFlavor: '春季嫩芽與春露豐富，路上較常出現藥草與果實。',
  },
  {
    id: 'summer',
    name: '夏季',
    summary: '陽光炙熱 · 體力消耗快',
    monsterRateBonus: 0.04,
    surpriseBonus: 0.04,
    extraDrain: 1,
    dmFlavor: '夏季陽光炙熱、商隊旅人眾多，趕路較易口渴消耗體力。',
  },
  {
    id: 'autumn',
    name: '秋季',
    summary: '金秋落葉 · 松露氣息濃',
    monsterRateBonus: 0.02,
    surpriseBonus: 0.1,
    extraDrain: 0,
    dmFlavor: '秋季正是松露香氣最濃郁的季節，森林裡到處藏著美食與珍寶線索。',
  },
  {
    id: 'winter',
    name: '冬季',
    summary: '寒冬霜雪 · 餓狼較常出沒',
    monsterRateBonus: 0.12,
    surpriseBonus: 0,
    extraDrain: 1,
    dmFlavor: '冬季寒風刺骨、食物稀缺，飢餓的野狼與怪物更頻繁地巡邏覓食。',
  },
];

const TIMES_OF_DAY: TimeConfig[] = [
  {
    id: 'dawn',
    name: '清晨',
    visibilityLabel: '晨光微亮',
    monsterRiskLabel: '怪物偏少',
    monsterRate: 0.18,
    surpriseBonus: 0.05,
    extraDrain: 0,
    dmFlavor: '清晨露水未乾、微光透進森林，適合整裝探路與採集。',
  },
  {
    id: 'day',
    name: '白天',
    visibilityLabel: '視野極佳',
    monsterRiskLabel: '怪物較少',
    monsterRate: 0.14,
    surpriseBonus: 0.12,
    extraDrain: 0,
    dmFlavor: '白天陽光充足、視野開闊清晰，較容易看清陷阱、岔路與路邊道具，怪物伏擊較少。',
  },
  {
    id: 'dusk',
    name: '黃昏',
    visibilityLabel: '暮色漸暗',
    monsterRiskLabel: '怪物活躍',
    monsterRate: 0.32,
    surpriseBonus: 0.03,
    extraDrain: 0,
    dmFlavor: '黃昏夕陽西下、哥布林廚師開始生火準備晚餐，夜間怪物也蠢蠢欲動。',
  },
  {
    id: 'night',
    name: '夜晚',
    visibilityLabel: '夜色昏暗',
    monsterRiskLabel: '怪物出沒率↑',
    monsterRate: 0.56,
    surpriseBonus: -0.05,
    extraDrain: 1,
    dmFlavor:
      '夜晚視線昏暗、危機四伏，大野狼強盜與夜行怪物的出現機率大幅提高，每步行動都格外緊張消耗體力！',
  },
];

/**
 * Each turn advances 1 time-of-day slot (4 turns = 1 full day).
 * Every 2 days (8 turns) transitions to the next season (32-turn full year cycle).
 */
export function getWorldCycleState(turn: number): WorldCycleState {
  const effectiveIndex = Math.max(0, turn > 0 ? turn - 1 : 0);
  const timeIdx = effectiveIndex % TIMES_OF_DAY.length;
  const day = Math.floor(effectiveIndex / TIMES_OF_DAY.length) + 1;
  const seasonIdx = Math.floor((day - 1) / 2) % SEASONS.length;

  const season = SEASONS[seasonIdx];
  const time = TIMES_OF_DAY[timeIdx];

  const monsterEncounterRate = Math.min(
    0.85,
    Math.max(0.08, Number((time.monsterRate + season.monsterRateBonus).toFixed(2)))
  );
  const surpriseChanceBonus = Number((time.surpriseBonus + season.surpriseBonus).toFixed(2));
  const extraHungerDrain = time.extraDrain + season.extraDrain;

  return {
    day,
    seasonId: season.id,
    seasonName: season.name,
    timeId: time.id,
    timeName: time.name,
    shortStatus: `第 ${day} 天 · ${season.name} ${time.name}`,
    effectSummary: `${time.visibilityLabel} · ${time.monsterRiskLabel}`,
    modifiers: {
      visibilityLabel: time.visibilityLabel,
      monsterRiskLabel: time.monsterRiskLabel,
      monsterEncounterRate,
      surpriseChanceBonus,
      extraHungerDrain,
    },
    dmDirective: `目前為泥巴王國第 ${day} 天「${season.name}・${time.name}」。${time.dmFlavor}${season.dmFlavor}（怪物風險係數 ${Math.round(
      monsterEncounterRate * 100
    )}%）`,
  };
}
