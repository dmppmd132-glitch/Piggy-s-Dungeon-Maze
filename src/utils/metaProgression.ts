import type {
  CookingJournalEntry,
  FoodBuffId,
  LegacyUpgradeId,
  LegacyUpgradesMap,
  MetaProgressionState,
  NpcId,
  RegionId,
} from '../types/game';
import { COOKING_RECIPES } from './cooking';

const META_STORAGE_KEY = 'mud_kingdom_meta_v1';

export interface LegacyUpgradeDefinition {
  id: LegacyUpgradeId;
  name: string;
  subtitle: string;
  description: string;
  maxLevel: number;
  costs: number[];
  effectSummary: (level: number) => string;
  nextLevelEffect: (currentLevel: number) => string;
}

export const DEFAULT_LEGACY_UPGRADES: LegacyUpgradesMap = {
  heirloom_hp: 0,
  heirloom_hunger: 0,
  heirloom_coins: 0,
  heirloom_xp: 0,
  heirloom_spoon: 0,
  heirloom_amulet: 0,
};

export const LEGACY_UPGRADES: LegacyUpgradeDefinition[] = [
  {
    id: 'heirloom_hp',
    name: '祖傳泥巴體魄',
    subtitle: '開局最大生命強化',
    description: '歷代小豬留下的強健體格，每階開局永久增加最大 HP 與初始生命 +10。',
    maxLevel: 5,
    costs: [15, 25, 35, 45, 60],
    effectSummary: (lv) => (lv > 0 ? `開局最大 HP +${lv * 10}` : '尚未覺醒'),
    nextLevelEffect: (lv) => `下一階：開局最大 HP +${(lv + 1) * 10}`,
  },
  {
    id: 'heirloom_hunger',
    name: '備用零食口袋',
    subtitle: '開局飽食上限強化',
    description: '縫在披風裡的秘藏口袋，每階開局增加最大飽食度 +10 並多帶 +8 初始飽食。',
    maxLevel: 5,
    costs: [15, 25, 35, 45, 60],
    effectSummary: (lv) => (lv > 0 ? `飽食上限 +${lv * 10} · 初始 +${lv * 8}` : '尚未覺醒'),
    nextLevelEffect: (lv) => `下一階：飽食上限 +${(lv + 1) * 10} · 初始 +${(lv + 1) * 8}`,
  },
  {
    id: 'heirloom_coins',
    name: '黃金存錢小豬',
    subtitle: '開局啟動資金',
    description: '出發前先敲開歷代祖先存下的小豬撲滿，每階額外攜帶 +20 豬豬幣出發。',
    maxLevel: 5,
    costs: [12, 20, 30, 40, 50],
    effectSummary: (lv) => (lv > 0 ? `開局豬豬幣 +${lv * 20}` : '尚未覺醒'),
    nextLevelEffect: (lv) => `下一階：開局豬豬幣 +${(lv + 1) * 20}`,
  },
  {
    id: 'heirloom_xp',
    name: '先祖冒險筆記',
    subtitle: '經驗倍率與初始技能點',
    description: '記載泥巴王國捷徑的古老筆記。Lv.1 起每次行動經驗 +15%/階；Lv.2 起開局直接 +1 技能點！',
    maxLevel: 3,
    costs: [20, 45, 70],
    effectSummary: (lv) =>
      lv <= 0
        ? '尚未覺醒'
        : `冒險經驗 +${lv * 15}%${lv >= 2 ? ' · 開局 +1 技能點' : ''}`,
    nextLevelEffect: (lv) =>
      `下一階：經驗 +${(lv + 1) * 15}%${lv + 1 >= 2 ? ' · 開局 +1 技能點' : ''}`,
  },
  {
    id: 'heirloom_spoon',
    name: '傳家白銀湯匙',
    subtitle: '開局神兵替代木湯匙',
    description: '擦得閃閃發亮的白銀湯匙！開局自動取代「生鏽的木湯匙」並預先裝備至主手（攻擊 +4）。',
    maxLevel: 1,
    costs: [40],
    effectSummary: (lv) => (lv > 0 ? '開局裝備「白銀湯匙」（攻+4）' : '尚未解鎖'),
    nextLevelEffect: () => '解鎖後開局自動裝備「白銀湯匙」',
  },
  {
    id: 'heirloom_amulet',
    name: '傳家幸運松露符',
    subtitle: '開局副手護身符',
    description: '散發淡淡松露香的家族護符！開局直接將「幸運松露護符」裝備於副手（防+4 · 省糧+1）。',
    maxLevel: 1,
    costs: [50],
    effectSummary: (lv) => (lv > 0 ? '開局副手「幸運松露護符」（防+4 省糧+1）' : '尚未解鎖'),
    nextLevelEffect: () => '解鎖後開局副手自帶「幸運松露護符」',
  },
];

export interface ComputedLegacyBonuses {
  maxHpBonus: number;
  maxHungerBonus: number;
  startingHungerBonus: number;
  startingCoinsBonus: number;
  xpMultiplier: number;
  startingSkillPoints: number;
  startingMainHand: string | null;
  startingOffHand: string | null;
}

export function createDefaultMetaProgression(): MetaProgressionState {
  return {
    trufflePoints: 0,
    totalRuns: 0,
    bestTurn: 0,
    bestScore: 0,
    legacyUpgrades: { ...DEFAULT_LEGACY_UPGRADES },
    discoveredItems: ['生鏽的木湯匙', '半顆蘋果'],
    defeatedBossIds: [],
    reachedRegionIds: ['mud_village'],
    befriendedNpcIds: [],
    cookedRecipeCounts: {},
    cookingJournal: {},
  };
}

export function normalizeMetaProgression(
  raw?: Partial<MetaProgressionState> | null
): MetaProgressionState {
  const base = createDefaultMetaProgression();
  if (!raw || typeof raw !== 'object') return base;

  const upgrades: LegacyUpgradesMap = { ...DEFAULT_LEGACY_UPGRADES };
  if (raw.legacyUpgrades && typeof raw.legacyUpgrades === 'object') {
    for (const def of LEGACY_UPGRADES) {
      const val = (raw.legacyUpgrades as Record<string, unknown>)[def.id];
      if (typeof val === 'number' && Number.isFinite(val)) {
        upgrades[def.id] = Math.max(0, Math.min(def.maxLevel, Math.floor(val)));
      }
    }
  }

  const discoveredItems = Array.isArray(raw.discoveredItems)
    ? Array.from(
        new Set(
          raw.discoveredItems.filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0
          )
        )
      )
    : base.discoveredItems;

  const cookedRecipeCounts: Partial<Record<FoodBuffId, number>> = {};
  const rawCooked =
    raw.cookedRecipeCounts && typeof raw.cookedRecipeCounts === 'object'
      ? (raw.cookedRecipeCounts as Record<string, unknown>)
      : {};
  for (const recipe of COOKING_RECIPES) {
    const val = rawCooked[recipe.id];
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      cookedRecipeCounts[recipe.id] = Math.floor(val);
    } else if (discoveredItems.includes(recipe.dishName)) {
      cookedRecipeCounts[recipe.id] = 1;
    }
  }

  const cookingJournal: Partial<Record<FoodBuffId, CookingJournalEntry>> = {};
  const rawJournal =
    raw.cookingJournal && typeof raw.cookingJournal === 'object'
      ? (raw.cookingJournal as Record<string, unknown>)
      : {};
  for (const recipe of COOKING_RECIPES) {
    const entry = rawJournal[recipe.id] as Partial<CookingJournalEntry> | undefined;
    if (entry && typeof entry === 'object' && typeof entry.latestReview === 'string') {
      cookingJournal[recipe.id] = {
        dishName: typeof entry.dishName === 'string' ? entry.dishName : recipe.dishName,
        latestReview: entry.latestReview,
        ingredientsUsed:
          typeof entry.ingredientsUsed === 'string'
            ? entry.ingredientsUsed
            : recipe.ingredientHint,
        cookedAt: typeof entry.cookedAt === 'string' ? entry.cookedAt : '',
        cookCount:
          typeof entry.cookCount === 'number' && entry.cookCount > 0
            ? Math.floor(entry.cookCount)
            : cookedRecipeCounts[recipe.id] ?? 1,
      };
    } else if ((cookedRecipeCounts[recipe.id] ?? 0) > 0) {
      cookingJournal[recipe.id] = {
        dishName: recipe.dishName,
        latestReview: recipe.piggyReview,
        ingredientsUsed: recipe.ingredientHint,
        cookedAt: '',
        cookCount: cookedRecipeCounts[recipe.id] ?? 1,
      };
    }
  }

  return {
    trufflePoints:
      typeof raw.trufflePoints === 'number' && raw.trufflePoints >= 0
        ? Math.floor(raw.trufflePoints)
        : 0,
    totalRuns:
      typeof raw.totalRuns === 'number' && raw.totalRuns >= 0
        ? Math.floor(raw.totalRuns)
        : 0,
    bestTurn:
      typeof raw.bestTurn === 'number' && raw.bestTurn >= 0 ? Math.floor(raw.bestTurn) : 0,
    bestScore:
      typeof raw.bestScore === 'number' && raw.bestScore >= 0 ? Math.floor(raw.bestScore) : 0,
    legacyUpgrades: upgrades,
    discoveredItems,
    defeatedBossIds: Array.isArray(raw.defeatedBossIds)
      ? Array.from(new Set(raw.defeatedBossIds.filter((x): x is string => typeof x === 'string')))
      : [],
    reachedRegionIds: Array.isArray(raw.reachedRegionIds)
      ? Array.from(new Set(['mud_village', ...raw.reachedRegionIds] as RegionId[]))
      : base.reachedRegionIds,
    befriendedNpcIds: Array.isArray(raw.befriendedNpcIds)
      ? Array.from(new Set(raw.befriendedNpcIds as NpcId[]))
      : [],
    cookedRecipeCounts,
    cookingJournal,
  };
}

export function loadMetaProgression(): MetaProgressionState {
  if (typeof window === 'undefined') return createDefaultMetaProgression();
  try {
    const raw = window.localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return createDefaultMetaProgression();
    return normalizeMetaProgression(JSON.parse(raw) as Partial<MetaProgressionState>);
  } catch {
    return createDefaultMetaProgression();
  }
}

export function saveMetaProgression(meta: MetaProgressionState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors
  }
}

export function calculateLegacyBonuses(upgrades: LegacyUpgradesMap): ComputedLegacyBonuses {
  const hpLv = upgrades.heirloom_hp || 0;
  const hungerLv = upgrades.heirloom_hunger || 0;
  const coinsLv = upgrades.heirloom_coins || 0;
  const xpLv = upgrades.heirloom_xp || 0;
  const spoonLv = upgrades.heirloom_spoon || 0;
  const amuletLv = upgrades.heirloom_amulet || 0;

  return {
    maxHpBonus: hpLv * 10,
    maxHungerBonus: hungerLv * 10,
    startingHungerBonus: hungerLv * 8,
    startingCoinsBonus: coinsLv * 20,
    xpMultiplier: 1 + xpLv * 0.15,
    startingSkillPoints: xpLv >= 2 ? 1 : 0,
    startingMainHand: spoonLv >= 1 ? '白銀湯匙' : null,
    startingOffHand: amuletLv >= 1 ? '幸運松露護符' : null,
  };
}

export function getNextLegacyUpgradeCost(
  def: LegacyUpgradeDefinition,
  currentLevel: number
): number | null {
  if (currentLevel >= def.maxLevel) return null;
  return def.costs[currentLevel] ?? null;
}

export function purchaseLegacyUpgrade(
  meta: MetaProgressionState,
  upgradeId: LegacyUpgradeId
): { nextMeta: MetaProgressionState; purchased: boolean; newLevel: number } {
  const def = LEGACY_UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return { nextMeta: meta, purchased: false, newLevel: 0 };

  const currentLevel = meta.legacyUpgrades[upgradeId] ?? 0;
  const cost = getNextLegacyUpgradeCost(def, currentLevel);
  if (cost === null || meta.trufflePoints < cost) {
    return { nextMeta: meta, purchased: false, newLevel: currentLevel };
  }

  const nextLevel = currentLevel + 1;
  const nextMeta: MetaProgressionState = {
    ...meta,
    trufflePoints: meta.trufflePoints - cost,
    legacyUpgrades: {
      ...meta.legacyUpgrades,
      [upgradeId]: nextLevel,
    },
    discoveredItems:
      upgradeId === 'heirloom_spoon'
        ? Array.from(new Set([...meta.discoveredItems, '白銀湯匙']))
        : upgradeId === 'heirloom_amulet'
        ? Array.from(new Set([...meta.discoveredItems, '幸運松露護符']))
        : meta.discoveredItems,
  };

  return { nextMeta, purchased: true, newLevel: nextLevel };
}

export function calculateRunEndTrufflePoints(params: {
  turn: number;
  unlockedCount: number;
  defeatedBossCount: number;
  foundTruffle: boolean;
  truffleMultiplier?: number;
}): number {
  const base = Math.max(
    6,
    Math.floor(params.turn * 1.5) +
      params.unlockedCount * 8 +
      params.defeatedBossCount * 8 +
      (params.foundTruffle ? 25 : 0)
  );
  return Math.round(base * Math.max(1, params.truffleMultiplier ?? 1));
}
