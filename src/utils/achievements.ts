import type {
  AchievementCounters,
  AchievementDefinition,
  AppliedDeltas,
  PlayerStats,
  UnlockedAchievement,
} from '../types/game';

export const HIDDEN_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'glutton_5',
    title: '米其林泥巴美食家',
    description: '在冒險中吃了 5 次食物或進食補飽',
    hint: '據說一直吃東西就會發生奇蹟...',
  },
  {
    id: 'wolf_survivor_3',
    title: '大野狼的老熟豬',
    description: '遇過 3 次大野狼強盜卻依然生龍活虎',
    hint: '常在林道走，哪有不遇狼？',
  },
  {
    id: 'goblin_pal_2',
    title: '哥布林主廚的試吃員',
    description: '和哥布林廚師或廚房交手／互動達 2 次',
    hint: '聞到怪味濃湯時別急著逃跑。',
  },
  {
    id: 'play_dead_master',
    title: '奧斯卡最佳石頭獎',
    description: '在冒險中選擇「裝死」或「假裝」達 2 次',
    hint: '有時躺平也是一種高深戰術。',
  },
  {
    id: 'starvation_survivor',
    title: '靠意志力撐住的胃',
    description: '在飽食度 0 的狀態下撐過 2 個回合依然存活',
    hint: '肚子空空卻不肯倒下的執念。',
  },
  {
    id: 'rich_piggy',
    title: '泥巴華爾街之豬',
    description: '同時持有 50 枚以上的豬豬幣',
    hint: '存夠亮晶晶的豬豬幣！',
  },
  {
    id: 'hoarder_5',
    title: '移動式資源回收豬',
    description: '背包同時裝滿 5 件以上的道具',
    hint: '什麼都想塞進背包裡的收集癖。',
  },
  {
    id: 'truffle_finder',
    title: '傳說松露獵人',
    description: '成功尋獲並取得「黃金黑松露」',
    hint: '泥巴王國最深處的終極傳說。',
  },
];

export const INITIAL_COUNTERS: AchievementCounters = {
  eatCount: 0,
  wolfCount: 0,
  goblinCount: 0,
  playDeadCount: 0,
  starveSurviveCount: 0,
};

const STORAGE_KEY = 'mud_kingdom_unlocked_achievements_v1';

export function loadPersistedAchievementIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function savePersistedAchievementIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage errors
  }
}

interface EvaluateTurnParams {
  turn: number;
  isStart: boolean;
  playerAction: string;
  story: string;
  imagePrompt: string;
  deltas: AppliedDeltas;
  prevStats: PlayerStats;
  nextStats: PlayerStats;
  prevCounters: AchievementCounters;
  alreadyUnlockedInRun: Set<string>;
}

export function evaluateTurnAchievements({
  turn,
  isStart,
  playerAction,
  story,
  imagePrompt,
  deltas,
  prevStats,
  nextStats,
  prevCounters,
  alreadyUnlockedInRun,
}: EvaluateTurnParams): {
  nextCounters: AchievementCounters;
  newlyUnlocked: UnlockedAchievement[];
} {
  const nextCounters: AchievementCounters = { ...prevCounters };
  const combinedText = `${playerAction} ${story} ${imagePrompt}`.toLowerCase();
  const actionLower = playerAction.toLowerCase();

  if (!isStart) {
    const ateFood =
      deltas.hungerChange > 0 ||
      /吃掉|吃下|啃|喝湯|品嚐|進食|蘋果|麵包|料理|大快朵頤|食物/.test(actionLower);
    if (ateFood) {
      nextCounters.eatCount += 1;
    }

    const metWolf = /大野狼|野狼|\bwolf\b/.test(combinedText);
    if (metWolf && nextStats.hp > 0) {
      nextCounters.wolfCount += 1;
    }

    const metGoblin = /哥布林|廚師|\bgoblin\b|\bchef\b/.test(combinedText);
    if (metGoblin) {
      nextCounters.goblinCount += 1;
    }

    const playedDead = /裝死|躺平|假裝自己是|假裝石頭|play dead/.test(actionLower);
    if (playedDead) {
      nextCounters.playDeadCount += 1;
    }

    if (prevStats.hunger <= 0 && nextStats.hp > 0) {
      nextCounters.starveSurviveCount += 1;
    }
  }

  const checks: Record<string, boolean> = {
    glutton_5: nextCounters.eatCount >= 5,
    wolf_survivor_3: nextCounters.wolfCount >= 3 && nextStats.hp > 0,
    goblin_pal_2: nextCounters.goblinCount >= 2,
    play_dead_master: nextCounters.playDeadCount >= 2,
    starvation_survivor: nextCounters.starveSurviveCount >= 2 && nextStats.hp > 0,
    rich_piggy: nextStats.coins >= 50,
    hoarder_5: nextStats.inventory.length >= 5,
    truffle_finder: nextStats.inventory.some((item) => item.includes('黃金黑松露')),
  };

  const newlyUnlocked: UnlockedAchievement[] = [];
  for (const def of HIDDEN_ACHIEVEMENTS) {
    if (checks[def.id] && !alreadyUnlockedInRun.has(def.id)) {
      newlyUnlocked.push({
        id: def.id,
        title: def.title,
        description: def.description,
        unlockedAtTurn: turn,
      });
    }
  }

  return { nextCounters, newlyUnlocked };
}
