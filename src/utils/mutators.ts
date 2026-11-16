import type { MutatorId } from '../types/game';

export interface RunMutatorDefinition {
  id: MutatorId;
  name: string;
  subtitle: string;
  bonusLabel: string;
  penaltyLabel: string;
  description: string;
  accentColor: string;
  scoreMultiplier: number;
  trufflePointsMultiplier: number;
  maxHpDelta: number;
  startingCoinsDelta: number;
  startingHungerDelta: number;
  extraHungerDrain: number;
  damageTakenMultiplier: number;
  coinGainBonusRatio: number;
  attackBonus: number;
  bossCritBonus: number;
  xpMultiplierBonus: number;
  itemDiscoveryBonus: number;
  blackMarketDiscountBonus: number;
  blackMarketSellMultiplier: number;
  startingItems: string[];
}

export const RUN_MUTATORS: RunMutatorDefinition[] = [
  {
    id: 'starving_sprint',
    name: '《飢餓狂潮試煉》',
    subtitle: '高食慾衝刺挑戰',
    bonusLabel: '豬豬幣 +35% · 積分 ×1.25 · 松露點 +35%',
    penaltyLabel: '每回飽食多耗 2 · 初始飽食 -10',
    description: '泥巴王國鬧起美味荒，小豬消化速度飛快，但也因此鍛鍊出更驚人的尋寶與搶幣效率。',
    accentColor: '#f5b041',
    scoreMultiplier: 1.25,
    trufflePointsMultiplier: 1.35,
    maxHpDelta: 0,
    startingCoinsDelta: 0,
    startingHungerDelta: -10,
    extraHungerDrain: 2,
    damageTakenMultiplier: 1,
    coinGainBonusRatio: 0.35,
    attackBonus: 0,
    bossCritBonus: 0,
    xpMultiplierBonus: 0,
    itemDiscoveryBonus: 0,
    blackMarketDiscountBonus: 0,
    blackMarketSellMultiplier: 1,
    startingItems: [],
  },
  {
    id: 'glass_cannon',
    name: '《脆皮猛豬試煉》',
    subtitle: '高傷極限對決',
    bonusLabel: '攻擊 +4 · Boss 暴擊 +25% · 經驗 +30% · 積分 ×1.30',
    penaltyLabel: '生命上限 -20 · 受傷 +20%',
    description: '捨棄部分脂肪換取爆發力！一不小心就會瀕死，但討伐 Boss 與練等速度快如閃電。',
    accentColor: '#ff7b6b',
    scoreMultiplier: 1.3,
    trufflePointsMultiplier: 1.35,
    maxHpDelta: -20,
    startingCoinsDelta: 0,
    startingHungerDelta: 0,
    extraHungerDrain: 0,
    damageTakenMultiplier: 1.2,
    coinGainBonusRatio: 0,
    attackBonus: 4,
    bossCritBonus: 0.25,
    xpMultiplierBonus: 0.3,
    itemDiscoveryBonus: 0,
    blackMarketDiscountBonus: 0,
    blackMarketSellMultiplier: 1,
    startingItems: [],
  },
  {
    id: 'market_frenzy',
    name: '《黑市走私狂歡》',
    subtitle: '金流與藏寶操作',
    bonusLabel: '黑市全商品再折 20% · 賣貨 +35% · 積分 ×1.20',
    penaltyLabel: '開局少 10 幣 · 野外尋物 -5%',
    description: '泥巴獾全面大清倉！雖然起手囊中羞澀，但只要會逛黑市就能輕鬆洗出神兵與遺物。',
    accentColor: '#ffd95a',
    scoreMultiplier: 1.2,
    trufflePointsMultiplier: 1.25,
    maxHpDelta: 0,
    startingCoinsDelta: -10,
    startingHungerDelta: 0,
    extraHungerDrain: 0,
    damageTakenMultiplier: 1,
    coinGainBonusRatio: 0,
    attackBonus: 0,
    bossCritBonus: 0,
    xpMultiplierBonus: 0,
    itemDiscoveryBonus: -0.05,
    blackMarketDiscountBonus: 0.2,
    blackMarketSellMultiplier: 1.35,
    startingItems: [],
  },
  {
    id: 'wild_forage',
    name: '《藏寶圖大豐收》',
    subtitle: '探索尋寶專精',
    bonusLabel: '尋獲額外食材 +20% · 開局送 2 片藏寶圖碎片 · 積分 ×1.25',
    penaltyLabel: '敵人／陷阱傷害 +15%',
    description: '森林裡埋滿古早藏寶圖碎片與珍稀野菇，但守衛松露的野生怪物也變得特別兇狠！',
    accentColor: '#9fd67a',
    scoreMultiplier: 1.25,
    trufflePointsMultiplier: 1.3,
    maxHpDelta: 0,
    startingCoinsDelta: 0,
    startingHungerDelta: 0,
    extraHungerDrain: 0,
    damageTakenMultiplier: 1.15,
    coinGainBonusRatio: 0,
    attackBonus: 0,
    bossCritBonus: 0,
    xpMultiplierBonus: 0,
    itemDiscoveryBonus: 0.2,
    blackMarketDiscountBonus: 0,
    blackMarketSellMultiplier: 1,
    startingItems: ['泛黃藏寶圖碎片', '泛黃藏寶圖碎片'],
  },
];

export function getMutatorById(id: MutatorId | null | undefined): RunMutatorDefinition | null {
  if (!id) return null;
  return RUN_MUTATORS.find((m) => m.id === id) ?? null;
}

export function normalizeMutatorId(raw: unknown): MutatorId | null {
  if (typeof raw !== 'string') return null;
  return RUN_MUTATORS.some((m) => m.id === raw) ? (raw as MutatorId) : null;
}

export function getDailyFeaturedMutator(date: Date = new Date()): RunMutatorDefinition {
  const daySeed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const idx = daySeed % RUN_MUTATORS.length;
  return RUN_MUTATORS[idx] ?? RUN_MUTATORS[0];
}
