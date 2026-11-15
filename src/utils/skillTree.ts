import type { MasteryId, MasteryRanks, SkillBranchId, SkillId } from '../types/game';

export interface SkillNodeDefinition {
  id: SkillId;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4 | 5;
  prerequisiteId: SkillId | null;
  name: string;
  effectLabel: string;
  description: string;
}

export interface SkillBranchMeta {
  id: SkillBranchId;
  name: string;
  subtitle: string;
  accentColor: string;
  borderColor: string;
}

export interface MasteryDefinition {
  id: MasteryId;
  name: string;
  effectPerRank: string;
  description: string;
  accentColor: string;
  borderColor: string;
}

export interface SkillModifiers {
  hungerDrainMultiplier: number;
  itemDiscoveryBonus: number;
  damageReductionMultiplier: number;
  eatBonusHp: number;
  maxHpBonus: number;
  maxHungerBonus: number;
  regenHpPerTurn: number;
  cheatDeathChance: number;
  coinGainBonusRatio: number;
  questRewardMultiplier: number;
  equipmentEffectivenessMultiplier: number;
  xpGainMultiplier: number;
  npcAffinityBonusPerInteraction: number;
  surpriseEventBonusChance: number;
  bonusCoinOnItemFind: number;
}

export const DEFAULT_MASTERY_RANKS: MasteryRanks = {
  vitality: 0,
  fortune: 0,
  focus: 0,
};

export function normalizeMasteryRanks(ranks?: Partial<MasteryRanks> | null): MasteryRanks {
  return {
    vitality:
      typeof ranks?.vitality === 'number' && ranks.vitality > 0 ? Math.floor(ranks.vitality) : 0,
    fortune:
      typeof ranks?.fortune === 'number' && ranks.fortune > 0 ? Math.floor(ranks.fortune) : 0,
    focus: typeof ranks?.focus === 'number' && ranks.focus > 0 ? Math.floor(ranks.focus) : 0,
  };
}

export const SKILL_BRANCHES: SkillBranchMeta[] = [
  {
    id: 'survival',
    name: '求生之道',
    subtitle: '耐餓抗壓、生命續航',
    accentColor: '#7ce06b',
    borderColor: '#5f8c4d',
  },
  {
    id: 'foraging',
    name: '尋寶嗅覺',
    subtitle: '提升尋物與暴富機率',
    accentColor: '#ffd95a',
    borderColor: '#d99b26',
  },
  {
    id: 'combat',
    name: '勇者豬蹄',
    subtitle: '減傷抗打、強化裝備',
    accentColor: '#ff9b8c',
    borderColor: '#c45b47',
  },
];

export const SKILL_TREE_NODES: SkillNodeDefinition[] = [
  // Survival Branch (T1 - T5)
  {
    id: 'survival_1',
    branch: 'survival',
    tier: 1,
    prerequisiteId: null,
    name: '鐵胃體質',
    effectLabel: '飢餓消耗 -15%',
    description: '鍛鍊出節能小豬胃，每回合自然流失的飽食度減少 15%。',
  },
  {
    id: 'survival_2',
    branch: 'survival',
    tier: 2,
    prerequisiteId: 'survival_1',
    name: '泥巴療癒',
    effectLabel: '最大HP +10 · 進食額外補 +3HP',
    description: '泥巴王國的精華滋養身體，生命上限永久 +10，進食恢復飽食度時額外回復 3 HP。',
  },
  {
    id: 'survival_3',
    branch: 'survival',
    tier: 3,
    prerequisiteId: 'survival_2',
    name: '頑強豬魂',
    effectLabel: '飢餓扣血減半 · 受傷再 -20%',
    description: '就算肚子咕嚕叫也能咬牙撐住，飢餓扣血減半並額外減免 20% 意外傷害。',
  },
  {
    id: 'survival_4',
    branch: 'survival',
    tier: 4,
    prerequisiteId: 'survival_3',
    name: '飽食冥想',
    effectLabel: '最大飽食度 +20 · 每回合回 +2HP',
    description: '把多餘的美食能量轉化為體內存糧，飽食度上限永久 +20，且每回合自然回復 2 HP。',
  },
  {
    id: 'survival_5',
    branch: 'survival',
    tier: 5,
    prerequisiteId: 'survival_4',
    name: '不死泥豬王',
    effectLabel: '最大HP再 +15 · 35% 致命傷鎖血',
    description: '傳說級泥巴護體！生命上限再 +15，受到致命傷害時有 35% 機率保留 1 HP 奇蹟生還。',
  },

  // Foraging Branch (T1 - T5)
  {
    id: 'foraging_1',
    branch: 'foraging',
    tier: 1,
    prerequisiteId: null,
    name: '靈敏豬鼻',
    effectLabel: '物品發現機率 +18%',
    description: '小豬的鼻子變得超靈敏！探索時有更高機率在草叢或土堆裡挖出實用道具。',
  },
  {
    id: 'foraging_2',
    branch: 'foraging',
    tier: 2,
    prerequisiteId: 'foraging_1',
    name: '松露雷達',
    effectLabel: '物品發現再 +12% · 豬豬幣 +20%',
    description: '累積的尋寶直覺讓金幣收入提升 20%，物品額外發現機率累積提升至 30%。',
  },
  {
    id: 'foraging_3',
    branch: 'foraging',
    tier: 3,
    prerequisiteId: 'foraging_2',
    name: '幸運大滿貫',
    effectLabel: '路邊驚喜率↑ · 獲物加贈 +5 幣',
    description: '好運連連！更容易觸發路邊驚喜事件，且每當獲得新道具時額外撿到 5 豬豬幣。',
  },
  {
    id: 'foraging_4',
    branch: 'foraging',
    tier: 4,
    prerequisiteId: 'foraging_3',
    name: '黃金鼻息',
    effectLabel: '豬豬幣再 +25% · 委託報酬 +30%',
    description: '只要聞到銅臭味就不會錯過任何好康，冒險金幣與 NPC 委託獎金大幅暴漲！',
  },
  {
    id: 'foraging_5',
    branch: 'foraging',
    tier: 5,
    prerequisiteId: 'foraging_4',
    name: '萬物鑑定師',
    effectLabel: '稀有額外尋物 +20% · 獲物再 +8 幣',
    description: '火眼金睛辨識寶藏！即使本回合已拿過道具仍有機會挖出稀有美食，獲物加贈再 +8 幣。',
  },

  // Combat Branch (T1 - T5)
  {
    id: 'combat_1',
    branch: 'combat',
    tier: 1,
    prerequisiteId: null,
    name: '鋼鐵豬蹄',
    effectLabel: '戰損扣血 -15%',
    description: '把豬蹄磨得閃閃發亮，遭遇大野狼、陷阱或毒物時扣血減少 15%。',
  },
  {
    id: 'combat_2',
    branch: 'combat',
    tier: 2,
    prerequisiteId: 'combat_1',
    name: '廚具大師',
    effectLabel: '裝備屬性加成 ×1.5',
    description: '熟練掌握主手與副手武器廚具的用法，裝備提供的攻擊／防禦／生存加成提升 50%。',
  },
  {
    id: 'combat_3',
    branch: 'combat',
    tier: 3,
    prerequisiteId: 'combat_2',
    name: '泥巴守護者',
    effectLabel: '全能強化（省糧+10% · 減傷+15% · 尋物+10%）',
    description: '成為泥巴王國真正的傳奇勇豬，各項生存、戰鬥與尋寶能力獲得全面加護。',
  },
  {
    id: 'combat_4',
    branch: 'combat',
    tier: 4,
    prerequisiteId: 'combat_3',
    name: '豬突猛進',
    effectLabel: '裝備屬性 ×1.8 · 冒險經驗值 +25%',
    description: '越戰越勇的霸道氣勢！裝備整體增幅提升至 1.8 倍，每次行動獲得的經驗值增加 25%。',
  },
  {
    id: 'combat_5',
    branch: 'combat',
    tier: 5,
    prerequisiteId: 'combat_4',
    name: '王國大元帥',
    effectLabel: '戰損再 -15% · NPC 互動好感額外 +2',
    description: '名震泥巴王國的傳奇英雄！減傷再提升 15%，且所有居民對你格外敬重，互動好感額外上升。',
  },
];

export const MASTERY_DEFINITIONS: MasteryDefinition[] = [
  {
    id: 'vitality',
    name: '肉體鍛鍊',
    effectPerRank: '每階：最大HP +5 · 進食額外補 +1HP',
    description: '突破極限的無限鍛鍊！可無限投資技能點數，持續墊高小豬生命上限與回復力。',
    accentColor: '#7ce06b',
    borderColor: '#5f8c4d',
  },
  {
    id: 'fortune',
    name: '聚寶直覺',
    effectPerRank: '每階：豬豬幣 +8% · 尋物機率 +4%',
    description: '越冒險越會撈錢！可無限投資技能點數，持續拉高金幣倍率與額外尋物運氣。',
    accentColor: '#ffd95a',
    borderColor: '#d99b26',
  },
  {
    id: 'focus',
    name: '戰鬥本能',
    effectPerRank: '每階：裝備屬性 +10% · 受傷減免 +3%',
    description: '將裝備與身法磨練至神乎其技！可無限投資技能點數，強化全身裝備倍率（減傷上限 70%）。',
    accentColor: '#ff9b8c',
    borderColor: '#c45b47',
  },
];

export function getSkillById(skillId: SkillId): SkillNodeDefinition | undefined {
  return SKILL_TREE_NODES.find((node) => node.id === skillId);
}

export function getMasteryById(masteryId: MasteryId): MasteryDefinition | undefined {
  return MASTERY_DEFINITIONS.find((m) => m.id === masteryId);
}

export function isSkillTreeMastered(learnedSkillIds: SkillId[]): boolean {
  const learnedSet = new Set(learnedSkillIds);
  return SKILL_TREE_NODES.every((node) => learnedSet.has(node.id));
}

export function getTotalMasteryRanks(masteryRanks?: Partial<MasteryRanks> | null): number {
  const normalized = normalizeMasteryRanks(masteryRanks);
  return normalized.vitality + normalized.fortune + normalized.focus;
}

export function getXpRequiredForNextLevel(level: number): number {
  return 25 + Math.max(0, level - 1) * 18;
}

export function calculateTurnXpGain(params: {
  isStart: boolean;
  foundItem: boolean;
  gainedCoins: boolean;
  completedQuest: boolean;
  unlockedAchievementsCount: number;
}): number {
  if (params.isStart) return 0;
  let xp = 12;
  if (params.foundItem || params.gainedCoins) xp += 6;
  if (params.completedQuest) xp += 15;
  if (params.unlockedAchievementsCount > 0) xp += 8 * params.unlockedAchievementsCount;
  return xp;
}

export function advanceLevelAndXp(
  currentLevel: number,
  currentXp: number,
  currentSkillPoints: number,
  gainedXp: number
): {
  level: number;
  xp: number;
  skillPoints: number;
  gainedLevels: number;
} {
  let level = Math.max(1, currentLevel);
  let xp = Math.max(0, currentXp + gainedXp);
  let skillPoints = Math.max(0, currentSkillPoints);
  let gainedLevels = 0;

  while (xp >= getXpRequiredForNextLevel(level)) {
    xp -= getXpRequiredForNextLevel(level);
    level += 1;
    skillPoints += 1;
    gainedLevels += 1;
  }

  return { level, xp, skillPoints, gainedLevels };
}

export function canLearnSkill(
  skillId: SkillId,
  learnedSkillIds: SkillId[],
  skillPoints: number
): boolean {
  if (skillPoints <= 0) return false;
  if (learnedSkillIds.includes(skillId)) return false;
  const node = getSkillById(skillId);
  if (!node) return false;
  if (node.prerequisiteId && !learnedSkillIds.includes(node.prerequisiteId)) {
    return false;
  }
  return true;
}

export function canLearnMastery(
  learnedSkillIds: SkillId[],
  skillPoints: number
): boolean {
  return skillPoints > 0 && isSkillTreeMastered(learnedSkillIds);
}

export function getAvailableSkillsToLearn(
  learnedSkillIds: SkillId[],
  skillPoints: number
): SkillNodeDefinition[] {
  if (skillPoints <= 0) return [];
  return SKILL_TREE_NODES.filter((node) =>
    canLearnSkill(node.id, learnedSkillIds, skillPoints)
  );
}

export function calculateSkillModifiers(
  learnedSkillIds: SkillId[],
  masteryRanks?: Partial<MasteryRanks> | null
): SkillModifiers {
  const learned = new Set(learnedSkillIds);
  const mastery = normalizeMasteryRanks(masteryRanks);

  let hungerDrainReduction = 0;
  if (learned.has('survival_1')) hungerDrainReduction += 0.15;
  if (learned.has('combat_3')) hungerDrainReduction += 0.1;

  let itemDiscoveryBonus = 0;
  if (learned.has('foraging_1')) itemDiscoveryBonus += 0.18;
  if (learned.has('foraging_2')) itemDiscoveryBonus += 0.12;
  if (learned.has('combat_3')) itemDiscoveryBonus += 0.1;
  if (learned.has('foraging_5')) itemDiscoveryBonus += 0.12;
  itemDiscoveryBonus += mastery.fortune * 0.04;

  let damageReduction = 0;
  if (learned.has('combat_1')) damageReduction += 0.15;
  if (learned.has('survival_3')) damageReduction += 0.2;
  if (learned.has('combat_3')) damageReduction += 0.15;
  if (learned.has('combat_5')) damageReduction += 0.15;
  damageReduction += mastery.focus * 0.03;

  const baseEquipMult = learned.has('combat_4') ? 1.8 : learned.has('combat_2') ? 1.5 : 1;

  return {
    hungerDrainMultiplier: Math.max(0.5, 1 - hungerDrainReduction),
    itemDiscoveryBonus: Math.min(0.85, itemDiscoveryBonus),
    damageReductionMultiplier: Math.max(0.3, 1 - damageReduction),
    eatBonusHp: (learned.has('survival_2') ? 3 : 0) + mastery.vitality * 1,
    maxHpBonus:
      (learned.has('survival_2') ? 10 : 0) +
      (learned.has('survival_5') ? 15 : 0) +
      mastery.vitality * 5,
    maxHungerBonus: learned.has('survival_4') ? 20 : 0,
    regenHpPerTurn: learned.has('survival_4') ? 2 : 0,
    cheatDeathChance: learned.has('survival_5') ? 0.35 : 0,
    coinGainBonusRatio:
      (learned.has('foraging_2') ? 0.2 : 0) +
      (learned.has('foraging_4') ? 0.25 : 0) +
      mastery.fortune * 0.08,
    questRewardMultiplier: learned.has('foraging_4') ? 1.3 : 1,
    equipmentEffectivenessMultiplier: baseEquipMult + mastery.focus * 0.1,
    xpGainMultiplier: learned.has('combat_4') ? 1.25 : 1,
    npcAffinityBonusPerInteraction: learned.has('combat_5') ? 2 : 0,
    surpriseEventBonusChance: learned.has('foraging_3') ? 0.18 : 0,
    bonusCoinOnItemFind:
      (learned.has('foraging_3') ? 5 : 0) + (learned.has('foraging_5') ? 8 : 0),
  };
}

const BONUS_FORAGE_ITEMS = [
  '空的瓶子',
  '森林泉水',
  '新鮮森林草藥',
  '香甜烤橡果',
  '野生香菇',
  '閃亮小碎金石',
];

const RARE_FORAGE_ITEMS = [
  '黃金蜂蜜鬆餅',
  '秘製煙燻培根乾',
  '發光松露碎片',
  '陳年橡樹果酒',
  '泥巴護身符',
  '野生香菇',
];

export function rollSkillBonusForageItem(
  itemDiscoveryBonus: number,
  alreadyFoundItemThisTurn: boolean,
  hasRareAppraiser: boolean = false,
  rng: () => number = Math.random
): string | null {
  if (hasRareAppraiser && alreadyFoundItemThisTurn) {
    if (rng() >= 0.2) return null;
    return RARE_FORAGE_ITEMS[Math.floor(rng() * RARE_FORAGE_ITEMS.length)];
  }
  if (itemDiscoveryBonus <= 0 || alreadyFoundItemThisTurn) return null;
  if (rng() >= itemDiscoveryBonus) return null;
  const pool =
    hasRareAppraiser && rng() < 0.5 ? RARE_FORAGE_ITEMS : BONUS_FORAGE_ITEMS;
  return pool[Math.floor(rng() * pool.length)];
}
