import type { SkillBranchId, SkillId } from '../types/game';

export interface SkillNodeDefinition {
  id: SkillId;
  branch: SkillBranchId;
  tier: 1 | 2 | 3;
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

export interface SkillModifiers {
  hungerDrainMultiplier: number;
  itemDiscoveryBonus: number;
  damageReductionMultiplier: number;
  eatBonusHp: number;
  maxHpBonus: number;
  coinGainBonusRatio: number;
  equipmentEffectivenessMultiplier: number;
  surpriseEventBonusChance: number;
  bonusCoinOnItemFind: number;
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
  // Survival Branch
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

  // Foraging Branch
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

  // Combat Branch
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
];

export function getSkillById(skillId: SkillId): SkillNodeDefinition | undefined {
  return SKILL_TREE_NODES.find((node) => node.id === skillId);
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

export function getAvailableSkillsToLearn(
  learnedSkillIds: SkillId[],
  skillPoints: number
): SkillNodeDefinition[] {
  if (skillPoints <= 0) return [];
  return SKILL_TREE_NODES.filter((node) =>
    canLearnSkill(node.id, learnedSkillIds, skillPoints)
  );
}

export function calculateSkillModifiers(learnedSkillIds: SkillId[]): SkillModifiers {
  const learned = new Set(learnedSkillIds);

  let hungerDrainReduction = 0;
  if (learned.has('survival_1')) hungerDrainReduction += 0.15;
  if (learned.has('combat_3')) hungerDrainReduction += 0.1;

  let itemDiscoveryBonus = 0;
  if (learned.has('foraging_1')) itemDiscoveryBonus += 0.18;
  if (learned.has('foraging_2')) itemDiscoveryBonus += 0.12;
  if (learned.has('combat_3')) itemDiscoveryBonus += 0.1;

  let damageReduction = 0;
  if (learned.has('combat_1')) damageReduction += 0.15;
  if (learned.has('survival_3')) damageReduction += 0.2;
  if (learned.has('combat_3')) damageReduction += 0.15;

  return {
    hungerDrainMultiplier: Math.max(0.55, 1 - hungerDrainReduction),
    itemDiscoveryBonus,
    damageReductionMultiplier: Math.max(0.45, 1 - damageReduction),
    eatBonusHp: learned.has('survival_2') ? 3 : 0,
    maxHpBonus: learned.has('survival_2') ? 10 : 0,
    coinGainBonusRatio: learned.has('foraging_2') ? 0.2 : 0,
    equipmentEffectivenessMultiplier: learned.has('combat_2') ? 1.5 : 1,
    surpriseEventBonusChance: learned.has('foraging_3') ? 0.18 : 0,
    bonusCoinOnItemFind: learned.has('foraging_3') ? 5 : 0,
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

export function rollSkillBonusForageItem(
  itemDiscoveryBonus: number,
  alreadyFoundItemThisTurn: boolean,
  rng: () => number = Math.random
): string | null {
  if (itemDiscoveryBonus <= 0 || alreadyFoundItemThisTurn) return null;
  if (rng() >= itemDiscoveryBonus) return null;
  return BONUS_FORAGE_ITEMS[Math.floor(rng() * BONUS_FORAGE_ITEMS.length)];
}
