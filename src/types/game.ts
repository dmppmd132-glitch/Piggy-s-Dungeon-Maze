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
  | 'foraging_1'
  | 'foraging_2'
  | 'foraging_3'
  | 'combat_1'
  | 'combat_2'
  | 'combat_3';

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
}

export interface GameOverSummary {
  title: string;
  epitaph: string;
  causeAction: string;
}
