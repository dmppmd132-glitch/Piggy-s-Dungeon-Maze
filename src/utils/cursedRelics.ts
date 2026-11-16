import type { CursedRelicId } from '../types/game';

export const MAX_CURSED_RELICS = 2;
export const CURSED_RELIC_PURIFY_COST = 25;
export const CURSED_RELIC_BOX_COST = 28;

export interface CursedRelicDefinition {
  id: CursedRelicId;
  name: string;
  subtitle: string;
  perkLabel: string;
  curseLabel: string;
  flavorText: string;
  accentColor: string;
  coinGainBonusRatio?: number;
  coinGainPenaltyRatio?: number;
  extraHungerDrain?: number;
  attackBonus?: number;
  bossCritBonus?: number;
  affinityDrainPerTurn?: number;
  regenHpPerTurn?: number;
  hungerGainMultiplier?: number;
  diceRollBonus?: number;
  itemDiscoveryBonus?: number;
  damageTakenMultiplier?: number;
  xpMultiplierBonus?: number;
  bonusCoinOnItemFind?: number;
  hpDrainPerTurn?: number;
  maxHpBonus?: number;
  maxHungerBonus?: number;
  eatHpBonus?: number;
}

export const CURSED_RELICS: CursedRelicDefinition[] = [
  {
    id: 'greedy_nose_ring',
    name: '《貪婪金豬鼻環》',
    subtitle: '財富暴衝流',
    perkLabel: '豬豬幣收益 +60%',
    curseLabel: '每回合額外消耗 3 飽食度',
    flavorText: '戴上後鼻子會自動偵測閃亮金幣，代價是看到什麼都更嘴饞、肚子餓超快！',
    accentColor: '#ffd95a',
    coinGainBonusRatio: 0.6,
    extraHungerDrain: 3,
  },
  {
    id: 'chili_fangs',
    name: '《暴走辣醬假牙》',
    subtitle: 'Boss 狂戰流',
    perkLabel: '攻擊 +6 · Boss 暴擊率 +20%',
    curseLabel: '每回合隨機 1 位 NPC 好感 -1',
    flavorText: '咬起來辣到噴火、連遠古守衛龍都怕三分，但因為口氣太嗆常常燻到路邊鄰居。',
    accentColor: '#ff7b6b',
    attackBonus: 6,
    bossCritBonus: 0.2,
    affinityDrainPerTurn: 1,
  },
  {
    id: 'vampire_fork',
    name: '《吸血鬼銀餐叉》',
    subtitle: '續戰吸血鬼流',
    perkLabel: '每次行動回復 +5 HP',
    curseLabel: '進食恢復飽食度 -25%',
    flavorText: '優雅的伯爵遺物，每回合偷偷替小豬回血，卻嫌棄普通麵包蘋果不夠精緻。',
    accentColor: '#e879f9',
    regenHpPerTurn: 5,
    hungerGainMultiplier: 0.75,
  },
  {
    id: 'gambler_monocle',
    name: '《泥巴老千單片鏡》',
    subtitle: '骰神尋寶流',
    perkLabel: 'D6 命運擲骰 +1 點 · 尋物機率 +15%',
    curseLabel: '受到戰鬥／陷阱傷害 +15%',
    flavorText: '鏡片裡閃爍著老千的金色機率線，但遮住半邊視線讓閃避動作變笨拙。',
    accentColor: '#7ec8f2',
    diceRollBonus: 1,
    itemDiscoveryBonus: 0.15,
    damageTakenMultiplier: 1.15,
  },
  {
    id: 'insomnia_truffle_bell',
    name: '《不眠松露響鈴》',
    subtitle: '極速練等流',
    perkLabel: '經驗值 +45% · 尋獲道具額外 +4 幣',
    curseLabel: '每次行動燃燒生命 -3 HP',
    flavorText: '鈴聲會逼著小豬亢奮狂奔、瘋狂練等撿寶，代價是精力透支小扣血。',
    accentColor: '#9fd67a',
    xpMultiplierBonus: 0.45,
    bonusCoinOnItemFind: 4,
    hpDrainPerTurn: 3,
  },
  {
    id: 'glutton_iron_stomach',
    name: '《無底黑洞鐵胃袋》',
    subtitle: '鐵胃坦克流',
    perkLabel: '最大生命／飽食上限各 +25 · 進食回血 +8',
    curseLabel: '每回飽食多耗 2 · 金幣收益 -20%',
    flavorText: '塞得下整頭烤全羊的傳說胃袋，但把零用錢全拿去買零食導致荷包縮水。',
    accentColor: '#f59d56',
    maxHpBonus: 25,
    maxHungerBonus: 25,
    eatHpBonus: 8,
    extraHungerDrain: 2,
    coinGainPenaltyRatio: 0.2,
  },
];

export function getCursedRelicById(id: CursedRelicId): CursedRelicDefinition | undefined {
  return CURSED_RELICS.find((r) => r.id === id);
}

export function normalizeActiveRelicIds(input: unknown): CursedRelicId[] {
  if (!Array.isArray(input)) return [];
  const validIds = new Set<CursedRelicId>(CURSED_RELICS.map((r) => r.id));
  const unique: CursedRelicId[] = [];
  for (const item of input) {
    if (typeof item === 'string' && validIds.has(item as CursedRelicId)) {
      const id = item as CursedRelicId;
      if (!unique.includes(id)) {
        unique.push(id);
      }
      if (unique.length >= MAX_CURSED_RELICS) break;
    }
  }
  return unique;
}

export function pickAvailableCursedRelics(
  activeIds: CursedRelicId[],
  count = 1,
  rng: () => number = Math.random
): CursedRelicDefinition[] {
  const pool = CURSED_RELICS.filter((r) => !activeIds.includes(r.id));
  if (pool.length === 0 || count <= 0) return [];
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export interface AggregatedCursedRelicModifiers {
  coinGainBonusRatio: number;
  coinGainPenaltyRatio: number;
  extraHungerDrain: number;
  attackBonus: number;
  bossCritBonus: number;
  affinityDrainPerTurn: number;
  regenHpPerTurn: number;
  hungerGainMultiplier: number;
  diceRollBonus: number;
  itemDiscoveryBonus: number;
  damageTakenMultiplier: number;
  xpMultiplierBonus: number;
  bonusCoinOnItemFind: number;
  hpDrainPerTurn: number;
  maxHpBonus: number;
  maxHungerBonus: number;
  eatHpBonus: number;
}

export function calculateCursedRelicModifiers(
  activeIds: CursedRelicId[]
): AggregatedCursedRelicModifiers {
  const result: AggregatedCursedRelicModifiers = {
    coinGainBonusRatio: 0,
    coinGainPenaltyRatio: 0,
    extraHungerDrain: 0,
    attackBonus: 0,
    bossCritBonus: 0,
    affinityDrainPerTurn: 0,
    regenHpPerTurn: 0,
    hungerGainMultiplier: 1,
    diceRollBonus: 0,
    itemDiscoveryBonus: 0,
    damageTakenMultiplier: 1,
    xpMultiplierBonus: 0,
    bonusCoinOnItemFind: 0,
    hpDrainPerTurn: 0,
    maxHpBonus: 0,
    maxHungerBonus: 0,
    eatHpBonus: 0,
  };

  for (const id of activeIds) {
    const relic = getCursedRelicById(id);
    if (!relic) continue;
    result.coinGainBonusRatio += relic.coinGainBonusRatio ?? 0;
    result.coinGainPenaltyRatio += relic.coinGainPenaltyRatio ?? 0;
    result.extraHungerDrain += relic.extraHungerDrain ?? 0;
    result.attackBonus += relic.attackBonus ?? 0;
    result.bossCritBonus += relic.bossCritBonus ?? 0;
    result.affinityDrainPerTurn += relic.affinityDrainPerTurn ?? 0;
    result.regenHpPerTurn += relic.regenHpPerTurn ?? 0;
    if (relic.hungerGainMultiplier) {
      result.hungerGainMultiplier *= relic.hungerGainMultiplier;
    }
    result.diceRollBonus += relic.diceRollBonus ?? 0;
    result.itemDiscoveryBonus += relic.itemDiscoveryBonus ?? 0;
    if (relic.damageTakenMultiplier) {
      result.damageTakenMultiplier *= relic.damageTakenMultiplier;
    }
    result.xpMultiplierBonus += relic.xpMultiplierBonus ?? 0;
    result.bonusCoinOnItemFind += relic.bonusCoinOnItemFind ?? 0;
    result.hpDrainPerTurn += relic.hpDrainPerTurn ?? 0;
    result.maxHpBonus += relic.maxHpBonus ?? 0;
    result.maxHungerBonus += relic.maxHungerBonus ?? 0;
    result.eatHpBonus += relic.eatHpBonus ?? 0;
  }

  return result;
}
