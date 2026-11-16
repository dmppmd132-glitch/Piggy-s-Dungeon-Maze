import type { ActiveFoodBuff, FoodBuffId } from '../types/game';

export interface CookingRecipeDefinition {
  id: FoodBuffId;
  dishName: string;
  durationTurns: number;
  effectLabel: string;
  description: string;
  keywordsA: string[];
  excludeA?: string[];
  keywordsB: string[];
  excludeB?: string[];
  ignoreNightExtraDrain?: boolean;
  hungerSaveFlat?: number;
  attackBonus?: number;
  damageReductionBonus?: number;
  regenHpPerTurn?: number;
  coinGainBonusRatio?: number;
  itemDiscoveryBonus?: number;
}

export interface AvailableCookingDish {
  recipe: CookingRecipeDefinition;
  indexA: number;
  indexB: number;
  itemA: string;
  itemB: string;
}

export interface FoodBuffModifiers {
  ignoreNightExtraDrain: boolean;
  hungerSaveFlat: number;
  attackBonus: number;
  damageReductionBonus: number;
  regenHpPerTurn: number;
  coinGainBonusRatio: number;
  itemDiscoveryBonus: number;
}

const NON_COOKABLE_GEAR_KEYWORDS = [
  '黃金黑松露',
  '湯匙',
  '平底鍋',
  '鐵鍋',
  '鍋鏟',
  '狼牙棒',
  '皇冠',
  '徽章',
  '護符',
  '木棒',
  '樹枝',
  '空瓶',
  '空的瓶子',
  '盾',
  '鎧甲',
  '披風',
  '長劍',
  '匕首',
  '日記',
  '地圖',
  '鑰匙',
];

export const COOKING_RECIPES: CookingRecipeDefinition[] = [
  {
    id: 'truffle_bisque',
    dishName: '黑松露黃金濃湯',
    durationTurns: 5,
    effectLabel: '豬豬幣 +30% · 攻擊 +3 · 每回合 +2 HP',
    description: '以珍貴松露碎片慢火熬煮的頂級濃湯，讓小豬精力充沛又財氣滿滿。',
    keywordsA: ['松露'],
    excludeA: ['黃金黑松露'],
    keywordsB: [
      '香菇',
      '野菇',
      '蘑菇',
      '泉水',
      '清泉',
      '山泉',
      '起司',
      '奶油',
      '鬆餅',
      '蘋果',
      '培根',
      '肉',
      '麵包',
      '果酒',
      '香料',
      '鹽',
    ],
    excludeB: ['黃金黑松露'],
    coinGainBonusRatio: 0.3,
    attackBonus: 3,
    regenHpPerTurn: 2,
  },
  {
    id: 'spicy_roast',
    dishName: '火辣菇菇烤肉',
    durationTurns: 4,
    effectLabel: '攻擊 +4 · 受傷再減免 15%',
    description: '香辣焦脆的烤肉配上山林野菇，吃完瞬間熱血沸騰、皮糙肉厚。',
    keywordsA: ['肉', '培根', '火腿', '香腸', '排骨', '雞腿', '香煎森林野菇'],
    keywordsB: ['香菇', '野菇', '蘑菇', '辣椒', '香料', '鹽', '蒜', '橡果', '蘋果', '麵包'],
    attackBonus: 4,
    damageReductionBonus: 0.15,
  },
  {
    id: 'herbal_tea',
    dishName: '森林活力花果茶',
    durationTurns: 5,
    effectLabel: '每回合回 +3 HP · 尋物機率 +12%',
    description: '清甜甘冽的森林泉水與果香藥草交織，喝完鼻子特別靈敏。',
    keywordsA: ['泉水', '清泉', '山泉', '活力泉水', '治療藥水', '果酒', '草藥', '藥草', '薄荷', '花茶'],
    keywordsB: ['蘋果', '橡果', '鬆餅', '草藥', '藥草', '薄荷', '蜂蜜', '漿果', '野果', '花'],
    regenHpPerTurn: 3,
    itemDiscoveryBonus: 0.12,
  },
  {
    id: 'warm_soup',
    dishName: '暖胃雜糧濃湯',
    durationTurns: 4,
    effectLabel: '免疫夜晚/冬夏額外扣飽食 · 省糧 +2',
    description: '熱呼呼的農村雜糧濃湯，寒夜與長途跋涉時最能替小豬護住胃袋。',
    keywordsA: [
      '香菇',
      '野菇',
      '蘑菇',
      '橡果',
      '蘋果',
      '南瓜',
      '胡蘿蔔',
      '玉米',
      '麵包',
      '蘋果泥',
      '起司',
      '鬆餅',
      '培根',
      '肉',
      '果',
    ],
    keywordsB: [
      '泉水',
      '清泉',
      '山泉',
      '鹽',
      '香料',
      '奶油',
      '起司',
      '香菇',
      '野菇',
      '蘑菇',
      '橡果',
      '蘋果',
      '麵包',
      '草藥',
      '藥草',
      '鬆餅',
      '肉',
    ],
    ignoreNightExtraDrain: true,
    hungerSaveFlat: 2,
  },
];

function matchesCookingSlot(
  itemName: string,
  keywords: string[],
  exclude?: string[]
): boolean {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) return false;
  if (NON_COOKABLE_GEAR_KEYWORDS.some((kw) => normalized.includes(kw.toLowerCase()))) {
    return false;
  }
  if (exclude && exclude.some((ex) => normalized.includes(ex.toLowerCase()))) {
    return false;
  }
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

export function findAvailableCookingRecipes(inventory: string[]): AvailableCookingDish[] {
  const available: AvailableCookingDish[] = [];

  for (const recipe of COOKING_RECIPES) {
    const indicesA: number[] = [];
    const indicesB: number[] = [];

    inventory.forEach((item, idx) => {
      if (matchesCookingSlot(item, recipe.keywordsA, recipe.excludeA)) {
        indicesA.push(idx);
      }
      if (matchesCookingSlot(item, recipe.keywordsB, recipe.excludeB)) {
        indicesB.push(idx);
      }
    });

    let matchedA = -1;
    let matchedB = -1;
    for (const iA of indicesA) {
      const iB = indicesB.find((idx) => idx !== iA);
      if (iB !== undefined) {
        matchedA = iA;
        matchedB = iB;
        break;
      }
    }

    if (matchedA !== -1 && matchedB !== -1) {
      available.push({
        recipe,
        indexA: matchedA,
        indexB: matchedB,
        itemA: inventory[matchedA],
        itemB: inventory[matchedB],
      });
    }
  }

  return available;
}

export function applyCooking(inventory: string[], dish: AvailableCookingDish): string[] | null {
  const { indexA, indexB } = dish;
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA === indexB ||
    indexA >= inventory.length ||
    indexB >= inventory.length
  ) {
    return null;
  }
  return inventory.filter((_, idx) => idx !== indexA && idx !== indexB);
}

export function activateOrRefreshFoodBuff(
  currentBuffs: ActiveFoodBuff[],
  recipe: CookingRecipeDefinition
): ActiveFoodBuff[] {
  const existing = currentBuffs.find((b) => b.id === recipe.id);
  const cappedMax = recipe.durationTurns + 2;

  if (existing) {
    const extendedTurns = Math.min(
      cappedMax,
      existing.remainingTurns + Math.max(2, Math.ceil(recipe.durationTurns / 2))
    );
    return currentBuffs.map((b) =>
      b.id === recipe.id
        ? {
            ...b,
            remainingTurns: extendedTurns,
            maxTurns: Math.max(b.maxTurns, extendedTurns),
          }
        : b
    );
  }

  const newBuff: ActiveFoodBuff = {
    id: recipe.id,
    dishName: recipe.dishName,
    effectLabel: recipe.effectLabel,
    remainingTurns: recipe.durationTurns,
    maxTurns: recipe.durationTurns,
    ignoreNightExtraDrain: recipe.ignoreNightExtraDrain,
    hungerSaveFlat: recipe.hungerSaveFlat,
    attackBonus: recipe.attackBonus,
    damageReductionBonus: recipe.damageReductionBonus,
    regenHpPerTurn: recipe.regenHpPerTurn,
    coinGainBonusRatio: recipe.coinGainBonusRatio,
    itemDiscoveryBonus: recipe.itemDiscoveryBonus,
  };

  return [...currentBuffs, newBuff];
}

export function calculateFoodBuffModifiers(buffs: ActiveFoodBuff[]): FoodBuffModifiers {
  return buffs.reduce<FoodBuffModifiers>(
    (acc, buff) => ({
      ignoreNightExtraDrain: acc.ignoreNightExtraDrain || Boolean(buff.ignoreNightExtraDrain),
      hungerSaveFlat: acc.hungerSaveFlat + (buff.hungerSaveFlat ?? 0),
      attackBonus: acc.attackBonus + (buff.attackBonus ?? 0),
      damageReductionBonus: Math.min(
        0.4,
        acc.damageReductionBonus + (buff.damageReductionBonus ?? 0)
      ),
      regenHpPerTurn: acc.regenHpPerTurn + (buff.regenHpPerTurn ?? 0),
      coinGainBonusRatio: acc.coinGainBonusRatio + (buff.coinGainBonusRatio ?? 0),
      itemDiscoveryBonus: acc.itemDiscoveryBonus + (buff.itemDiscoveryBonus ?? 0),
    }),
    {
      ignoreNightExtraDrain: false,
      hungerSaveFlat: 0,
      attackBonus: 0,
      damageReductionBonus: 0,
      regenHpPerTurn: 0,
      coinGainBonusRatio: 0,
      itemDiscoveryBonus: 0,
    }
  );
}

export function tickFoodBuffs(buffs: ActiveFoodBuff[]): {
  nextBuffs: ActiveFoodBuff[];
  expiredNames: string[];
} {
  const nextBuffs: ActiveFoodBuff[] = [];
  const expiredNames: string[] = [];

  for (const buff of buffs) {
    const remaining = buff.remainingTurns - 1;
    if (remaining > 0) {
      nextBuffs.push({ ...buff, remainingTurns: remaining });
    } else {
      expiredNames.push(buff.dishName);
    }
  }

  return { nextBuffs, expiredNames };
}

export function normalizeActiveFoodBuffs(raw: unknown): ActiveFoodBuff[] {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set<string>(COOKING_RECIPES.map((r) => r.id));
  return raw
    .filter((item): item is ActiveFoodBuff => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Partial<ActiveFoodBuff>;
      return (
        typeof obj.id === 'string' &&
        validIds.has(obj.id) &&
        typeof obj.dishName === 'string' &&
        typeof obj.remainingTurns === 'number' &&
        obj.remainingTurns > 0
      );
    })
    .map((b) => ({
      ...b,
      maxTurns: typeof b.maxTurns === 'number' && b.maxTurns >= b.remainingTurns ? b.maxTurns : b.remainingTurns,
    }));
}
