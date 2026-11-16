import type { CompanionLogEvent, NpcId } from '../types/game';
import { getNpcById } from './npcAffinity';

export const COMPANION_UNLOCK_AFFINITY = 50;

export interface ForestCompanionDefinition {
  npcId: NpcId;
  companionTitle: string;
  adventurePerkLabel: string;
  cookingSynergyLabel: string;
  description: string;
  regenHpPerTurn: number;
  defenseBonus: number;
  damageReductionBonus: number;
  hungerSaveFlat: number;
  ignoreNightExtraDrain: boolean;
  itemDiscoveryBonus: number;
  coinGainBonusRatio: number;
  xpMultiplierBonus: number;
  bonusDurationTurnsOnCook: number;
  forageGiftChance: number;
  forageGiftPool: string[];
}

export const FOREST_COMPANIONS: Record<NpcId, ForestCompanionDefinition> = {
  goblin_chef: {
    npcId: 'goblin_chef',
    companionTitle: '隨行野炊主廚',
    adventurePerkLabel: '每回合 +2 HP · 尋獲野炊食材',
    cookingSynergyLabel: '料理 Buff 額外 +1 回合 · 共餐好感 +6',
    description: '背著大鐵鍋跟在小豬身旁，隨時替你掌勺控火並把山林野味變進背包。',
    regenHpPerTurn: 2,
    defenseBonus: 0,
    damageReductionBonus: 0,
    hungerSaveFlat: 0,
    ignoreNightExtraDrain: false,
    itemDiscoveryBonus: 0.04,
    coinGainBonusRatio: 0,
    xpMultiplierBonus: 0,
    bonusDurationTurnsOnCook: 1,
    forageGiftChance: 0.32,
    forageGiftPool: ['森林香菇', '香煎培根碎', '雪山薄荷藥草束'],
  },
  squirrel_postman: {
    npcId: 'squirrel_postman',
    companionTitle: '草叢搜刮小跟班',
    adventurePerkLabel: '尋物 +10% · 省糧 +1 · 叼來乾糧',
    cookingSynergyLabel: '從樹洞摸出 1 份額外食材 · 共餐好感 +6',
    description: '跑得比松露香味還快的小郵差，路上與營地都能從樹洞掏出隱藏乾糧。',
    regenHpPerTurn: 0,
    defenseBonus: 0,
    damageReductionBonus: 0,
    hungerSaveFlat: 1,
    ignoreNightExtraDrain: false,
    itemDiscoveryBonus: 0.1,
    coinGainBonusRatio: 0,
    xpMultiplierBonus: 0,
    bonusDurationTurnsOnCook: 0,
    forageGiftChance: 0.36,
    forageGiftPool: ['烤橡果', '半顆蘋果', '千年森林泉水'],
  },
  turtle_mayor: {
    npcId: 'turtle_mayor',
    companionTitle: '龜殼護衛長者',
    adventurePerkLabel: '防禦 +3 · 受傷再減免 10%',
    cookingSynergyLabel: '喝湯順心立即回復 +10 HP · 共餐好感 +6',
    description: '雖然走路慢半拍，但關鍵時刻會用厚實龜殼替小豬擋下大野狼撲擊！',
    regenHpPerTurn: 0,
    defenseBonus: 3,
    damageReductionBonus: 0.1,
    hungerSaveFlat: 0,
    ignoreNightExtraDrain: false,
    itemDiscoveryBonus: 0,
    coinGainBonusRatio: 0,
    xpMultiplierBonus: 0,
    bonusDurationTurnsOnCook: 0,
    forageGiftChance: 0.15,
    forageGiftPool: ['森林泉水', '嫩草藥束'],
  },
  badger_merchant: {
    npcId: 'badger_merchant',
    companionTitle: '隨行鑑寶鑑定師',
    adventurePerkLabel: '獲得金幣 +15% · 黑市折扣連動',
    cookingSynergyLabel: '試吃開心打賞 +12 豬豬幣 · 共餐好感 +6',
    description: '戴著單片眼鏡替小豬鑑定沿途破銅爛鐵，連吃飽喝足時都會大方給小費！',
    regenHpPerTurn: 0,
    defenseBonus: 0,
    damageReductionBonus: 0,
    hungerSaveFlat: 0,
    ignoreNightExtraDrain: false,
    itemDiscoveryBonus: 0.05,
    coinGainBonusRatio: 0.15,
    xpMultiplierBonus: 0,
    bonusDurationTurnsOnCook: 0,
    forageGiftChance: 0.18,
    forageGiftPool: ['黃金陳年起司塊', '發光松露碎片'],
  },
  owl_scholar: {
    npcId: 'owl_scholar',
    companionTitle: '夜視松露導師',
    adventurePerkLabel: '經驗 +20% · 免疫夜晚額外飢餓',
    cookingSynergyLabel: '指點料理筆記立即 +8 經驗 · 共餐好感 +6',
    description: '在黑夜裡雙眼發亮的失眠學者，指引最省體力的夜間路線與升級捷徑。',
    regenHpPerTurn: 0,
    defenseBonus: 0,
    damageReductionBonus: 0,
    hungerSaveFlat: 0,
    ignoreNightExtraDrain: true,
    itemDiscoveryBonus: 0.05,
    coinGainBonusRatio: 0,
    xpMultiplierBonus: 0.2,
    bonusDurationTurnsOnCook: 0,
    forageGiftChance: 0.2,
    forageGiftPool: ['雪山薄荷藥草束', '森林香菇'],
  },
};

export function getCompanionDefinition(
  npcId: NpcId | null | undefined
): ForestCompanionDefinition | null {
  if (!npcId) return null;
  return FOREST_COMPANIONS[npcId] ?? null;
}

export function isCompanionUnlocked(affinity: number): boolean {
  return affinity >= COMPANION_UNLOCK_AFFINITY;
}

export interface CompanionCookingSynergyResult {
  bonusDurationTurns: number;
  bonusHp: number;
  bonusCoins: number;
  bonusXp: number;
  bonusItem: string | null;
  affinityDelta: number;
  summaryText: string;
}

export function resolveCompanionCookingSynergy(
  companionId: NpcId | null,
  rng: () => number = Math.random
): CompanionCookingSynergyResult {
  if (!companionId) {
    return {
      bonusDurationTurns: 0,
      bonusHp: 0,
      bonusCoins: 0,
      bonusXp: 0,
      bonusItem: null,
      affinityDelta: 0,
      summaryText: '',
    };
  }

  const def = FOREST_COMPANIONS[companionId];
  const npc = getNpcById(companionId);
  const npcName = npc?.name ?? '森林小跟班';

  if (companionId === 'goblin_chef') {
    return {
      bonusDurationTurns: 1,
      bonusHp: 0,
      bonusCoins: 0,
      bonusXp: 0,
      bonusItem: null,
      affinityDelta: 6,
      summaryText: `${npcName}替你調整完美火候：料理 Buff 額外 +1 回合，好感 +6！`,
    };
  }
  if (companionId === 'squirrel_postman') {
    const gift = def.forageGiftPool[Math.floor(rng() * def.forageGiftPool.length)];
    return {
      bonusDurationTurns: 0,
      bonusHp: 0,
      bonusCoins: 0,
      bonusXp: 0,
      bonusItem: gift,
      affinityDelta: 6,
      summaryText: `${npcName}邊吃邊從口袋塞回「${gift}」，好感 +6！`,
    };
  }
  if (companionId === 'turtle_mayor') {
    return {
      bonusDurationTurns: 0,
      bonusHp: 10,
      bonusCoins: 0,
      bonusXp: 0,
      bonusItem: null,
      affinityDelta: 6,
      summaryText: `${npcName}陪你慢慢喝完熱湯：額外回復 +10 HP，好感 +6！`,
    };
  }
  if (companionId === 'badger_merchant') {
    return {
      bonusDurationTurns: 0,
      bonusHp: 0,
      bonusCoins: 12,
      bonusXp: 0,
      bonusItem: null,
      affinityDelta: 6,
      summaryText: `${npcName}吃得眉開眼笑，大方打賞 +12 豬豬幣，好感 +6！`,
    };
  }
  return {
    bonusDurationTurns: 0,
    bonusHp: 0,
    bonusCoins: 0,
    bonusXp: 8,
    bonusItem: null,
    affinityDelta: 6,
    summaryText: `${npcName}替這鍋料理寫下食療筆記：立即 +8 經驗值，好感 +6！`,
  };
}

export function rollCompanionTurnSupport(
  companionId: NpcId | null,
  turn: number,
  rng: () => number = Math.random
): {
  giftedItem: string | null;
  logEvent: CompanionLogEvent | null;
} {
  if (!companionId) {
    return { giftedItem: null, logEvent: null };
  }
  const def = FOREST_COMPANIONS[companionId];
  const npc = getNpcById(companionId);
  if (!def || !npc) {
    return { giftedItem: null, logEvent: null };
  }

  const shouldForage = turn >= 2 && rng() < def.forageGiftChance;
  if (!shouldForage) {
    return { giftedItem: null, logEvent: null };
  }

  const giftedItem = def.forageGiftPool[Math.floor(rng() * def.forageGiftPool.length)];
  return {
    giftedItem,
    logEvent: {
      npcId: companionId,
      npcName: npc.name,
      companionTitle: def.companionTitle,
      message: `${npc.name}趁著趕路空檔鑽進草叢，替小豬搜刮到「${giftedItem}」放進背包！`,
      giftedItem,
    },
  };
}
