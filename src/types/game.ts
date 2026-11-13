export type GamePhase = 'TITLE' | 'PLAYING' | 'GAME_OVER';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  coins: number;
  inventory: string[];
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
}

export interface GameOverSummary {
  title: string;
  epitaph: string;
  causeAction: string;
}
