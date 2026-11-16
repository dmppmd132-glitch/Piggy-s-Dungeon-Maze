export type GamePhase = 'TITLE' | 'TALENT_SELECT' | 'PLAYING' | 'GAME_OVER';

export type TalentId = 'glutton' | 'fleet_foot' | 'lucky_star';

export interface TalentModifiers {
  foodGainMultiplier: number;
  hungerDrainMultiplier: number;
  coinGainMultiplier: number;
}

export type EquipSlot = 'mainHand' | 'offHand';

export interface EquipmentState {
  mainHand: string | null;
  offHand: string | null;
}

export interface EquipmentBonuses {
  attackBonus: number;
  defenseBonus: number;
  hungerSaveBonus: number;
  coinBonus: number;
}

export type SkillBranchId = 'survival' | 'foraging' | 'combat';

export type SkillId =
  | 'survival_1'
  | 'survival_2'
  | 'survival_3'
  | 'survival_4'
  | 'survival_5'
  | 'foraging_1'
  | 'foraging_2'
  | 'foraging_3'
  | 'foraging_4'
  | 'foraging_5'
  | 'combat_1'
  | 'combat_2'
  | 'combat_3'
  | 'combat_4'
  | 'combat_5';

export type MasteryId = 'vitality' | 'fortune' | 'focus';

export interface MasteryRanks {
  vitality: number;
  fortune: number;
  focus: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  coins: number;
  inventory: string[];
  equipment: EquipmentState;
  talentId: TalentId | null;
  modifiers: TalentModifiers;
  level: number;
  xp: number;
  skillPoints: number;
  learnedSkillIds: SkillId[];
  masteryRanks?: MasteryRanks;
}

export interface DmTurnResponse {
  story: string;
  hp_change: number;
  hunger_change: number;
  coins_change: number;
  new_item: string | null;
  lost_item: string | null;
  choices: [string, string, string];
  image_prompt: string;
  interacted_npc?: string | null;
  affinity_change?: number;
}

export interface AppliedDeltas {
  hpChange: number;
  hungerChange: number;
  coinsChange: number;
  starvationDamage: number;
  newItem: string | null;
  lostItem: string | null;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  hint: string;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  unlockedAtTurn: number;
}

export interface AchievementCounters {
  eatCount: number;
  wolfCount: number;
  goblinCount: number;
  playDeadCount: number;
  starveSurviveCount: number;
}

export type RandomEventCategory = 'weather' | 'surprise';

export interface TurnRandomEvent {
  id: string;
  category: RandomEventCategory;
  title: string;
  description: string;
  hpDelta: number;
  hungerDelta: number;
  coinsDelta: number;
  tempItem: string | null;
}

export interface ActiveQuest {
  id: string;
  npcName: string;
  title: string;
  description: string;
  targetItem: string;
  targetKeywords: string[];
  rewardCoins: number;
  rewardItem: string | null;
  clueHint: string;
  acceptedTurn: number;
}

export interface QuestLogEvent {
  type: 'accepted' | 'completed';
  questId: string;
  npcName: string;
  title: string;
  description?: string;
  targetItem: string;
  rewardCoins?: number;
  rewardItem?: string | null;
}

export interface LevelUpInfo {
  fromLevel: number;
  toLevel: number;
  gainedPoints: number;
}

export type NpcId =
  | 'goblin_chef'
  | 'squirrel_postman'
  | 'turtle_mayor'
  | 'badger_merchant'
  | 'owl_scholar';

export interface NpcAffinityEvent {
  npcId: NpcId;
  npcName: string;
  delta: number;
  newAffinity: number;
  tierLabel: string;
  discountCoinsSaved: number;
  proactiveClue: string | null;
}

export type RegionId =
  | 'mud_village'
  | 'truffle_forest'
  | 'goblin_kitchen'
  | 'wolf_canyon'
  | 'truffle_sanctum'
  | 'endless_abyss';

export interface ActiveBossState {
  id: string;
  regionId: RegionId;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  rewardCoins: number;
  rewardItem: string;
  trufflePointsReward: number;
}

export interface BossLogEvent {
  type: 'spawned' | 'hit' | 'defeated';
  bossName: string;
  bossTitle: string;
  regionName: string;
  damageDealt: number;
  isCrit?: boolean;
  bossHpAfter: number;
  bossMaxHp: number;
  rewardCoins?: number;
  rewardItem?: string;
  trufflePointsEarned?: number;
  nextRegionName?: string | null;
}

export type LegacyUpgradeId =
  | 'heirloom_hp'
  | 'heirloom_hunger'
  | 'heirloom_coins'
  | 'heirloom_xp'
  | 'heirloom_spoon'
  | 'heirloom_amulet';

export type LegacyUpgradesMap = Record<LegacyUpgradeId, number>;

export type FoodBuffId = 'warm_soup' | 'spicy_roast' | 'herbal_tea' | 'truffle_bisque';

export interface MetaProgressionState {
  trufflePoints: number;
  totalRuns: number;
  bestTurn: number;
  bestScore: number;
  legacyUpgrades: LegacyUpgradesMap;
  discoveredItems: string[];
  defeatedBossIds: string[];
  reachedRegionIds: RegionId[];
  befriendedNpcIds: NpcId[];
  cookedRecipeCounts?: Partial<Record<FoodBuffId, number>>;
}

export interface ActiveFoodBuff {
  id: FoodBuffId;
  dishName: string;
  effectLabel: string;
  remainingTurns: number;
  maxTurns: number;
  ignoreNightExtraDrain?: boolean;
  hungerSaveFlat?: number;
  attackBonus?: number;
  damageReductionBonus?: number;
  regenHpPerTurn?: number;
  coinGainBonusRatio?: number;
  itemDiscoveryBonus?: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  playerAction: string | null;
  story: string;
  deltas: AppliedDeltas;
  hpAfter: number;
  hungerAfter: number;
  imagePrompt: string;
  choices: string[];
  unlockedAchievements?: UnlockedAchievement[];
  randomEvent?: TurnRandomEvent | null;
  questEvent?: QuestLogEvent | null;
  levelUp?: LevelUpInfo | null;
  bonusForagedItem?: string | null;
  npcAffinityEvent?: NpcAffinityEvent | null;
  cheatDeathTriggered?: boolean;
  bossEvent?: BossLogEvent | null;
  regionName?: string;
  expiredBuffNames?: string[];
}

export interface GameOverSummary {
  title: string;
  epitaph: string;
  causeAction: string;
}
