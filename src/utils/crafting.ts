export interface CraftingRecipe {
  id: string;
  labelA: string;
  keywordsA: string[];
  excludeA?: string[];
  labelB: string;
  keywordsB: string[];
  excludeB?: string[];
  resultItem: string;
  description: string;
}

export interface AvailableCraft {
  recipe: CraftingRecipe;
  indexA: number;
  indexB: number;
  itemA: string;
  itemB: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'forest_vital_water',
    labelA: '空的瓶子',
    keywordsA: ['空的瓶子', '空瓶', '空玻璃瓶', '玻璃瓶', '水壺'],
    excludeA: ['活力泉水', '藥水'],
    labelB: '森林泉水',
    keywordsB: ['森林泉水', '泉水', '清泉', '山泉', '聖水'],
    excludeB: ['活力泉水'],
    resultItem: '森林活力泉水',
    description: '清冽甘甜的魔法泉水，飲用後可大幅恢復體力與精神。',
  },
  {
    id: 'forest_healing_potion',
    labelA: '空的瓶子',
    keywordsA: ['空的瓶子', '空瓶', '空玻璃瓶', '玻璃瓶'],
    excludeA: ['藥水', '活力泉水'],
    labelB: '森林草藥',
    keywordsB: ['藥草', '草藥', '治癒草', '薄荷葉'],
    resultItem: '森林治療藥水',
    description: '將鮮採藥草封入瓶中搖勻而成的隨身治癒藥水。',
  },
  {
    id: 'mashed_apple_puree',
    labelA: '生鏽的木湯匙',
    keywordsA: ['木湯匙', '湯匙'],
    labelB: '半顆蘋果',
    keywordsB: ['半顆蘋果', '蘋果'],
    excludeB: ['蘋果泥'],
    resultItem: '手搗蘋果泥',
    description: '用木湯匙細心搗碎的香甜蘋果泥，連大野狼都想偷吃一口。',
  },
  {
    id: 'pan_fried_mushroom',
    labelA: '平底鍋',
    keywordsA: ['平底鍋', '鐵鍋', '炒鍋'],
    labelB: '森林野菇',
    keywordsB: ['蘑菇', '野菇', '香菇', '菌'],
    excludeB: ['香煎'],
    resultItem: '香煎森林野菇',
    description: '外酥內嫩的熱騰騰煎菇料理，香氣四溢。',
  },
  {
    id: 'gourmet_truffle_dish',
    labelA: '黑松露',
    keywordsA: ['黑松露', '松露'],
    excludeA: ['黃金黑松露', '極品松露料理'],
    labelB: '香濃佐料',
    keywordsB: ['起司', '奶油', '大蒜', '蒜', '麵包', '香料'],
    excludeB: ['極品松露料理'],
    resultItem: '極品松露料理',
    description: '只有泥巴王國頂級貪吃豬才懂得享用的夢幻奢華料理。',
  },
  {
    id: 'piggy_warrior_mace',
    labelA: '堅固木棒',
    keywordsA: ['木棒', '樹枝', '木棍', '拐杖'],
    excludeA: ['狼牙棒'],
    labelB: '硬質護具或石塊',
    keywordsB: ['石頭', '圓石', '鐵塊', '鍋蓋', '盾牌'],
    excludeB: ['狼牙棒'],
    resultItem: '豬豬戰士狼牙棒',
    description: '把硬物綁在木棍頂端製成的簡易護身武器。',
  },
];

function matchesIngredient(itemName: string, keywords: string[], exclude?: string[]): boolean {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) return false;
  if (exclude && exclude.some((ex) => normalized.includes(ex.toLowerCase()))) {
    return false;
  }
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

export function findAvailableCrafts(inventory: string[]): AvailableCraft[] {
  const available: AvailableCraft[] = [];

  for (const recipe of CRAFTING_RECIPES) {
    const indicesA: number[] = [];
    const indicesB: number[] = [];

    inventory.forEach((item, idx) => {
      if (matchesIngredient(item, recipe.keywordsA, recipe.excludeA)) {
        indicesA.push(idx);
      }
      if (matchesIngredient(item, recipe.keywordsB, recipe.excludeB)) {
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

export function applyCrafting(inventory: string[], craft: AvailableCraft): string[] | null {
  const { indexA, indexB, recipe } = craft;
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA === indexB ||
    indexA >= inventory.length ||
    indexB >= inventory.length
  ) {
    return null;
  }

  const nextInventory = inventory.filter((_, idx) => idx !== indexA && idx !== indexB);
  nextInventory.push(recipe.resultItem);
  return nextInventory;
}
