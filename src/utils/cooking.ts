import type { ActiveFoodBuff, FoodBuffId } from '../types/game';

export interface CookingRecipeDefinition {
  id: FoodBuffId;
  dishName: string;
  durationTurns: number;
  effectLabel: string;
  description: string;
  ingredientHint: string;
  piggyRating: string;
  piggyReview: string;
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
    ingredientHint: '松露碎片 ＋ 香菇／泉水／起司／培根／蘋果',
    piggyRating: '★★★★★ 鎮村神湯',
    piggyReview:
      '「呼嚕呼嚕！一入口就像整座松露森林在嘴裡開派對，連鍋底都被我用豬鼻子舔得比白銀湯匙還亮！」',
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
    ingredientHint: '培根／肉類 ＋ 野菇／香料／橡果／蘋果／麵包',
    piggyRating: '★★★★★ 戰神烤串',
    piggyReview:
      '「嘶哈——好辣好香！吃完覺得自己能直接一頭撞飛大野狼，下次記得再多配半口森林泉水！」',
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
    ingredientHint: '泉水／草藥／藥水 ＋ 蘋果／橡果／鬆餅／草藥',
    piggyRating: '★★★★☆ 嗅覺特調',
    piggyReview:
      '「清甜又回甘～喝完整隻豬都輕飄飄的，連埋在泥土三尺深的松露味道都逃不過我的鼻子！」',
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
    ingredientHint: '任意兩種常見食材（野菇／橡果／蘋果／泉水／麵包）',
    piggyRating: '★★★★☆ 暖心宵夜',
    piggyReview:
      '「雖然看起來像大雜燴，但半夜在黑漆漆的森林裡喝上一口，肚皮暖呼呼的就不怕半夜餓醒啦！」',
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

const PIGGY_REVIEW_OPENERS: Record<FoodBuffId, string[]> = {
  truffle_bisque: [
    '「呼嚕呼嚕！一入口就像整座松露森林在嘴裡開派對，連鍋底都被我用豬鼻子舔得比白銀湯匙還亮！」',
    '「喔喔喔！這金黃濃稠的松露湯頭太罪惡了，喝完覺得自己頭上都閃著豬豬金幣的光芒！」',
    '「天啊，這簡直是泥巴王國皇室等級的濃湯！每喝一口都在替我的錢包跟胃袋祈福呢！」',
    '「咕嘟咕嘟三口見底！這香味濃郁到大野狼路過都忘記搶劫，只想問我能不能分半碗！」',
  ],
  spicy_roast: [
    '「嘶哈——好辣好香！吃完覺得自己能直接一頭撞飛大野狼，下次記得再多配半口森林泉水！」',
    '「滋滋作響的焦香烤肉超對味！嘴唇辣得像噴火小豬，但渾身肌肉瞬間硬邦邦的！」',
    '「喀滋喀滋咬下去超多汁！辣度剛剛好把寒冷跟疲勞全燒光，現在就算遇上 Boss 我也不怕！」',
    '「哇嗚——辣到豬耳朵直冒煙！但這股野性香味實在太上頭，明天還要再烤一串！」',
  ],
  herbal_tea: [
    '「清甜又回甘～喝完整隻豬都輕飄飄的，連埋在泥土三尺深的松露味道都逃不過我的鼻子！」',
    '「呼——花果茶香把一身泥巴味都洗淨了！鼻尖突然靈敏十倍，草叢裡有什麼寶物全都聞得到！」',
    '「咕嚕咕嚕喝下這壺神仙特調，傷口感覺暖暖癒合中，連路邊松鼠都跑來跟我要配方！」',
    '「酸酸甜甜的草本香氣在舌尖跳舞～感覺下一回合一定會踩到閃亮亮的驚喜好物！」',
  ],
  warm_soup: [
    '「雖然看起來像大雜燴，但半夜在黑漆漆的森林裡喝上一口，肚皮暖呼呼的就不怕半夜餓醒啦！」',
    '「熱騰騰的雜糧濃湯太治癒了！喝完就像蓋了一層厚厚的泥巴棉被，再遠的路都走得動！」',
    '「一口氣喝光兩大碗！滿滿的膳食纖維把胃袋塞得踏踏實實，完全不浪費任何一點旅途食材！」',
    '「別看名字樸實，這鍋湯可是救命神隊友！暖胃又耐餓，貪吃小豬給出滿分好評！」',
  ],
};

export function generateRandomPiggyReview(
  recipe: CookingRecipeDefinition,
  itemA: string,
  itemB: string,
  context?: {
    hpPercent?: number;
    hungerPercent?: number;
    companionName?: string | null;
    rng?: () => number;
  }
): string {
  const rng = context?.rng ?? Math.random;
  const pool = PIGGY_REVIEW_OPENERS[recipe.id] ?? [recipe.piggyReview];
  const baseLine = pool[Math.floor(rng() * pool.length)];

  const tailComments: string[] = [
    `（本次以「${itemA}」配「${itemB}」下鍋慢煮，風味絕佳！）`,
    `（沒想到「${itemA}」跟「${itemB}」在鍋裡這麼合拍！）`,
  ];

  if (typeof context?.hungerPercent === 'number' && context.hungerPercent <= 30) {
    tailComments.push(`（餓扁的時候吃到「${itemA}＋${itemB}」煮的菜，幸福感直接爆表！）`);
  }
  if (typeof context?.hpPercent === 'number' && context.hpPercent <= 45) {
    tailComments.push(`（負傷途中喝到這鍋「${itemA}」特調，瞬間又充滿活下去的勇氣！）`);
  }
  if (context?.companionName) {
    tailComments.push(
      `（跟班「${context.companionName}」也在旁連聲稱讚「${itemA}＋${itemB}」這組神搭配！）`
    );
  }

  const tail = tailComments[Math.floor(rng() * tailComments.length)];
  return `${baseLine} ${tail}`;
}

export function activateOrRefreshFoodBuff(
  currentBuffs: ActiveFoodBuff[],
  recipe: CookingRecipeDefinition,
  bonusDurationTurns = 0
): ActiveFoodBuff[] {
  const existing = currentBuffs.find((b) => b.id === recipe.id);
  const totalNewDuration = recipe.durationTurns + Math.max(0, bonusDurationTurns);
  const cappedMax = totalNewDuration + 2;

  if (existing) {
    const extendedTurns = Math.min(
      cappedMax,
      existing.remainingTurns + Math.max(2, Math.ceil(totalNewDuration / 2)) + Math.max(0, bonusDurationTurns)
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
    remainingTurns: totalNewDuration,
    maxTurns: totalNewDuration,
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
