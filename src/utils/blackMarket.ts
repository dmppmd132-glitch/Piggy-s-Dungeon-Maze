import type { BlackMarketOffer, BlackMarketState, EquipmentState } from '../types/game';
import { getItemEquipmentProfile } from './equipment';
import { getAffinityTier } from './npcAffinity';

type CatalogTemplate = Omit<BlackMarketOffer, 'purchasedCount'>;

const INGREDIENT_CATALOG: CatalogTemplate[] = [
  {
    id: 'bm_truffle_shard',
    name: '發光松露碎片',
    category: 'ingredient',
    description: '泥巴獾從地下秘窖摸來的珍稀松露碎塊，適合煮「黑松露黃金濃湯」。',
    effectSummary: '高級料理食材 · 烹飪可賺金幣增益',
    basePrice: 36,
    stock: 2,
  },
  {
    id: 'bm_spicy_jerky',
    name: '秘製地獄辣肉乾',
    category: 'ingredient',
    description: '哥布林暗巷流出的特製辣肉乾，直接帶在身上或下鍋烤肉都超猛。',
    effectSummary: '料理食材（肉／辣）· 烹飪「火辣菇菇烤肉」',
    basePrice: 24,
    stock: 2,
  },
  {
    id: 'bm_spring_water',
    name: '千年森林泉水',
    category: 'ingredient',
    description: '清冽甘甜的濃縮山泉，喝起來回甘，下鍋煮茶煮湯都是極品基底。',
    effectSummary: '萬用湯底食材 · 烹飪「花果茶／雜糧濃湯」',
    basePrice: 18,
    stock: 2,
  },
  {
    id: 'bm_golden_cheese',
    name: '黃金陳年起司塊',
    category: 'ingredient',
    description: '散發濃郁奶香的整塊陳年起司，能把任何剩菜瞬間變成高級濃湯。',
    effectSummary: '濃湯食材 · 亦可合成極品松露料理',
    basePrice: 22,
    stock: 2,
  },
  {
    id: 'bm_snow_herb',
    name: '雪山薄荷藥草束',
    category: 'ingredient',
    description: '帶點清涼薄荷香的鮮採藥草，可合成治療藥水也能拿來煮花果茶。',
    effectSummary: '藥草食材 · 可合成治療藥水或煮花果茶',
    basePrice: 20,
    stock: 2,
  },
];

const TONIC_AND_GEAR_CATALOG: CatalogTemplate[] = [
  {
    id: 'bm_piggy_tonic',
    name: '黑市現燉十全豬骨湯',
    category: 'tonic',
    description: '買下當場趁熱喝完！不佔背包空間，直接替小豬恢復大量體力與飽食度。',
    effectSummary: '立即生效：HP +28 · 飽食度 +28',
    basePrice: 38,
    stock: 1,
  },
  {
    id: 'bm_steel_pan',
    name: '精鋼重擊平底鍋',
    category: 'gear',
    description: '泥巴獾私藏的重型廚具，敲大野狼與煎野菇一樣順手。',
    effectSummary: '裝備主手：攻擊 +4 · 防禦 +2',
    basePrice: 54,
    stock: 1,
  },
  {
    id: 'bm_mud_shield',
    name: '替身泥巴厚鍋蓋',
    category: 'gear',
    description: '塗滿硬化泥漿的厚實鍋蓋，放在副手能大幅減輕 Boss 與陷阱傷害。',
    effectSummary: '裝備副手：防禦 +4 · 省糧 +1',
    basePrice: 50,
    stock: 1,
  },
  {
    id: 'bm_lucky_compass',
    name: '黑市改裝尋寶羅盤',
    category: 'gear',
    description: '指針永遠指向亮晶晶財寶的神秘羅盤，裝進副手財運滾滾來。',
    effectSummary: '裝備副手：防 +1 · 省糧 +1 · 尋寶 +3幣',
    basePrice: 60,
    stock: 1,
  },
];

const MYSTERY_BOX_OFFER: CatalogTemplate = {
  id: 'bm_mystery_box',
  name: '泥巴獾神秘黑市盲盒',
  category: 'mystery',
  description: '購買後立即現場開箱！可能開出稀有神兵、大量食材、金幣暴擊或泥巴蟹小驚嚇。',
  effectSummary: '隨機開出：神兵 / 雙倍食材 / 豬豬幣返利',
  basePrice: 32,
  stock: 2,
};

export const BLACK_MARKET_REROLL_COST = 10;

export function getBlackMarketCycleIndex(turn: number): number {
  return Math.max(0, Math.floor(Math.max(0, turn - 1) / 4));
}

export function generateBlackMarketOffers(
  cycleIndex: number,
  rerollCount = 0
): BlackMarketOffer[] {
  const seed = Math.abs(cycleIndex * 13 + rerollCount * 7);
  const ingA = INGREDIENT_CATALOG[seed % INGREDIENT_CATALOG.length];
  const ingB = INGREDIENT_CATALOG[(seed + 2) % INGREDIENT_CATALOG.length];
  const gearOrTonicA = TONIC_AND_GEAR_CATALOG[seed % TONIC_AND_GEAR_CATALOG.length];
  const gearOrTonicB =
    TONIC_AND_GEAR_CATALOG[(seed + 1) % TONIC_AND_GEAR_CATALOG.length];

  return [ingA, ingB, gearOrTonicA, gearOrTonicB, MYSTERY_BOX_OFFER].map((item) => ({
    ...item,
    purchasedCount: 0,
  }));
}

export function createInitialBlackMarketState(turn = 1, rerollCount = 0): BlackMarketState {
  const cycleIndex = getBlackMarketCycleIndex(turn);
  return {
    cycleIndex,
    rerollCount,
    offers: generateBlackMarketOffers(cycleIndex, rerollCount),
    affinityBoostedInCycle: false,
  };
}

export function normalizeBlackMarketState(raw: unknown, currentTurn = 1): BlackMarketState {
  if (!raw || typeof raw !== 'object') {
    return createInitialBlackMarketState(currentTurn);
  }
  const obj = raw as Partial<BlackMarketState>;
  const cycleIndex =
    typeof obj.cycleIndex === 'number'
      ? obj.cycleIndex
      : getBlackMarketCycleIndex(currentTurn);
  const rerollCount = typeof obj.rerollCount === 'number' ? obj.rerollCount : 0;

  if (!Array.isArray(obj.offers) || obj.offers.length === 0) {
    return {
      cycleIndex,
      rerollCount,
      offers: generateBlackMarketOffers(cycleIndex, rerollCount),
      affinityBoostedInCycle: Boolean(obj.affinityBoostedInCycle),
    };
  }

  return {
    cycleIndex,
    rerollCount,
    offers: obj.offers,
    affinityBoostedInCycle: Boolean(obj.affinityBoostedInCycle),
  };
}

export function calculateBlackMarketPrice(basePrice: number, badgerAffinity: number): number {
  const tier = getAffinityTier(badgerAffinity);
  if (tier.discountRate <= 0) return basePrice;
  return Math.max(4, Math.round(basePrice * (1 - tier.discountRate)));
}

export function estimateItemSellPrice(itemName: string): number | null {
  const lower = itemName.trim().toLowerCase();
  if (!lower) return null;
  if (lower.includes('黃金黑松露')) {
    // Protect main quest treasure from accidental liquidation
    return null;
  }

  const profile = getItemEquipmentProfile(itemName);
  if (profile.categoryLabel === '傳說武器' || profile.categoryLabel === '傳說護具') {
    return 48;
  }
  if (profile.categoryLabel === '強效武器') {
    return 32;
  }
  if (profile.categoryLabel === '尋寶飾品') {
    return lower.includes('松露') ? 24 : 26;
  }
  if (profile.categoryLabel === '近戰裝備' || profile.categoryLabel === '防護裝備') {
    return lower.includes('生鏽') ? 10 : 20;
  }
  if (profile.categoryLabel === '隨身補給') {
    if (lower.includes('料理') || lower.includes('活力') || lower.includes('藥水')) {
      return 18;
    }
    return 10;
  }
  return 12;
}

export interface DuplicateClutterSummary {
  indicesToSell: number[];
  itemsToSell: string[];
  totalCoins: number;
}

export function findDuplicateSellableClutter(
  inventory: string[],
  equipment: EquipmentState
): DuplicateClutterSummary {
  const seen = new Set<string>();
  if (equipment.mainHand) seen.add(equipment.mainHand);
  if (equipment.offHand) seen.add(equipment.offHand);

  const indicesToSell: number[] = [];
  const itemsToSell: string[] = [];
  let totalCoins = 0;

  inventory.forEach((item, idx) => {
    const sellPrice = estimateItemSellPrice(item);
    if (sellPrice === null) return;
    if (seen.has(item)) {
      indicesToSell.push(idx);
      itemsToSell.push(item);
      totalCoins += sellPrice;
    } else {
      seen.add(item);
    }
  });

  return { indicesToSell, itemsToSell, totalCoins };
}

export interface MysteryBoxOutcome {
  title: string;
  description: string;
  gainedItems: string[];
  coinsDelta: number;
  hpDelta: number;
}

export function rollMysteryBoxOutcome(rng: () => number = Math.random): MysteryBoxOutcome {
  const roll = rng();
  if (roll < 0.25) {
    return {
      title: '傳說走私貨！',
      description: '箱底竟藏著一柄擦得雪亮的「白銀湯匙」和一小袋金幣！',
      gainedItems: ['白銀湯匙'],
      coinsDelta: 18,
      hpDelta: 0,
    };
  }
  if (roll < 0.55) {
    return {
      title: '頂級松露食材包！',
      description: '打開瞬間香氣撲鼻，裡面有「發光松露碎片」和「黃金陳年起司塊」！',
      gainedItems: ['發光松露碎片', '黃金陳年起司塊'],
      coinsDelta: 0,
      hpDelta: 0,
    };
  }
  if (roll < 0.82) {
    return {
      title: '豬豬幣大爆倉！',
      description: '盲盒裡叮叮噹噹掉出一大袋忘記誰藏的豬豬幣！',
      gainedItems: [],
      coinsDelta: 55,
      hpDelta: 0,
    };
  }
  return {
    title: '暴躁泥巴蟹突襲！',
    description: '一隻生氣的泥巴蟹鉗了小豬鼻子一下（-5 HP），但留下了「鮮美泥巴蟹肉」和「千年森林泉水」！',
    gainedItems: ['鮮美泥巴蟹肉', '千年森林泉水'],
    coinsDelta: 8,
    hpDelta: -5,
  };
}
