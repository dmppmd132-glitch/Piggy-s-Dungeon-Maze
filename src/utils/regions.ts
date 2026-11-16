import type { ActiveBossState, BossLogEvent, RegionId } from '../types/game';

export interface RegionBossTemplate {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  attackPower: number;
  rewardCoins: number;
  rewardItem: string;
  trufflePointsReward: number;
  dmSummary: string;
}

export interface RegionDefinition {
  id: RegionId;
  stageNumber: number;
  name: string;
  subtitle: string;
  description: string;
  recommendedTurnsToBoss: number;
  accentColor: string;
  boss: RegionBossTemplate;
}

export const WORLD_REGIONS: RegionDefinition[] = [
  {
    id: 'mud_village',
    stageNumber: 1,
    name: '泥漿村莊周邊',
    subtitle: '第 1 區 · 啟程草地',
    description: '剛踏出泥巴村的田野與泥坑，雖然景色熟悉，但泥坑深處似乎正咕嚕冒泡。',
    recommendedTurnsToBoss: 5,
    accentColor: '#9fd67a',
    boss: {
      id: 'boss_slime_king',
      name: '暴躁泥巴史萊姆王',
      title: '村口泥坑霸主',
      maxHp: 60,
      attackPower: 10,
      rewardCoins: 35,
      rewardItem: '史萊姆皇冠護符',
      trufflePointsReward: 12,
      dmSummary: '渾身裹滿閃亮泥漿、頭頂歪斜王冠的巨大史萊姆擋住了通往森林的木橋！',
    },
  },
  {
    id: 'truffle_forest',
    stageNumber: 2,
    name: '迷霧松露林',
    subtitle: '第 2 區 · 香氣幽林',
    description: '濃霧與松露香氣交織的古老橡樹林，地上滿是神秘腳印與野生菌菇。',
    recommendedTurnsToBoss: 11,
    accentColor: '#7ec8f2',
    boss: {
      id: 'boss_boar_glutton',
      name: '貪吃巨牙野豬王',
      title: '松露林掠奪者',
      maxHp: 95,
      attackPower: 13,
      rewardCoins: 55,
      rewardItem: '野豬獠牙鍋鏟',
      trufflePointsReward: 16,
      dmSummary: '嘴裡叼著半籃松露的巨大長毛野豬王發出震耳欲聾的哼叫，衝撞林間霧氣！',
    },
  },
  {
    id: 'goblin_kitchen',
    stageNumber: 3,
    name: '哥布林地下廚房',
    subtitle: '第 3 區 · 鐵鍋迷宮',
    description: '鍋碗瓢盆叮噹作響的地底石窟，空氣中飄著辣椒與神秘香料的嗆鼻煙霧。',
    recommendedTurnsToBoss: 17,
    accentColor: '#f5b041',
    boss: {
      id: 'boss_goblin_ironchef',
      name: '地獄辣醬鐵鍋主廚',
      title: '地底黑暗料理長',
      maxHp: 135,
      attackPower: 16,
      rewardCoins: 80,
      rewardItem: '傳說不沾鍋蓋盾',
      trufflePointsReward: 22,
      dmSummary: '揮舞冒火大鐵杓、試圖把冒險小豬做成烤乳豬的瘋狂哥布林料理長現身！',
    },
  },
  {
    id: 'wolf_canyon',
    stageNumber: 4,
    name: '大野狼峽谷',
    subtitle: '第 4 區 · 險峻風谷',
    description: '寒風呼嘯的紅岩峽谷，盜賊團在岩壁高處虎視眈眈，考驗小豬的裝備與膽識。',
    recommendedTurnsToBoss: 24,
    accentColor: '#ff9b8c',
    boss: {
      id: 'boss_silver_wolf',
      name: '月影銀牙狼王',
      title: '峽谷強盜首領',
      maxHp: 175,
      attackPower: 20,
      rewardCoins: 120,
      rewardItem: '傳說銀狼牙狼牙棒',
      trufflePointsReward: 28,
      dmSummary: '披著月光銀毛的狼王躍下懸崖截住去路，雙眼閃爍冷冽寒光！',
    },
  },
  {
    id: 'truffle_sanctum',
    stageNumber: 5,
    name: '黃金松露聖殿',
    subtitle: '第 5 區 · 傳說終點',
    description: '散發金色光芒的地下古老殿堂，傳說中的「黃金黑松露」就沉睡在祭壇中央。',
    recommendedTurnsToBoss: 30,
    accentColor: '#ffd95a',
    boss: {
      id: 'boss_truffle_dragon',
      name: '遠古松露守衛龍',
      title: '黃金黑松露守護者',
      maxHp: 230,
      attackPower: 24,
      rewardCoins: 200,
      rewardItem: '黃金黑松露',
      trufflePointsReward: 40,
      dmSummary: '由泥土與金礦結晶凝聚的遠古守衛龍甦醒，守護著聖殿祭壇上的黃金黑松露！',
    },
  },
];

export const ENDLESS_ABYSS_REGION: RegionDefinition = {
  id: 'endless_abyss',
  stageNumber: 6,
  name: '無盡松露深淵',
  subtitle: '無盡模式 · 傳說之後',
  description: '擊敗聖殿守衛龍後開啟的無限深淵領域，每 10 回合都會湧現更強大的幻影頭目！',
  recommendedTurnsToBoss: 40,
  accentColor: '#c89bff',
  boss: {
    id: 'boss_abyss_phantom',
    name: '深淵黑松露幻影',
    title: '無盡領域考驗者',
    maxHp: 260,
    attackPower: 25,
    rewardCoins: 180,
    rewardItem: '深淵松露徽章',
    trufflePointsReward: 35,
    dmSummary: '深淵裂縫中浮現由無數松露香氣與暗影凝聚的幻影巨獸，向傳奇小豬發起挑戰！',
  },
};

export const STORY_BOSS_IDS = WORLD_REGIONS.map((r) => r.boss.id);

export function getRegionById(regionId: RegionId): RegionDefinition {
  if (regionId === 'endless_abyss') return ENDLESS_ABYSS_REGION;
  return WORLD_REGIONS.find((r) => r.id === regionId) ?? WORLD_REGIONS[0];
}

export function getCurrentRegionState(
  defeatedBossIds: string[],
  turn: number,
  activeBoss: ActiveBossState | null
): {
  region: RegionDefinition;
  nextMilestoneTurn: number;
  turnsUntilBoss: number;
  progressPercent: number;
  isEndless: boolean;
  storyBossesDefeatedCount: number;
} {
  if (activeBoss) {
    const region = getRegionById(activeBoss.regionId);
    return {
      region,
      nextMilestoneTurn: turn,
      turnsUntilBoss: 0,
      progressPercent: 100,
      isEndless: region.id === 'endless_abyss',
      storyBossesDefeatedCount: STORY_BOSS_IDS.filter((id) => defeatedBossIds.includes(id)).length,
    };
  }

  const undefeatedRegion = WORLD_REGIONS.find(
    (r) => !defeatedBossIds.includes(r.boss.id)
  );

  if (!undefeatedRegion) {
    // Endless mode: Boss spawns every 10 turns (e.g. 40, 50, 60...)
    const baseTurn = Math.max(30, Math.floor((turn - 1) / 10) * 10);
    const nextMilestoneTurn = baseTurn + 10;
    const turnsIntoCycle = Math.max(0, turn - baseTurn);
    const progressPercent = Math.min(100, Math.round((turnsIntoCycle / 10) * 100));
    return {
      region: ENDLESS_ABYSS_REGION,
      nextMilestoneTurn,
      turnsUntilBoss: Math.max(0, nextMilestoneTurn - turn),
      progressPercent,
      isEndless: true,
      storyBossesDefeatedCount: STORY_BOSS_IDS.length,
    };
  }

  const prevRegionIdx = WORLD_REGIONS.indexOf(undefeatedRegion) - 1;
  const startTurn = prevRegionIdx >= 0 ? WORLD_REGIONS[prevRegionIdx].recommendedTurnsToBoss : 0;
  const targetTurn = undefeatedRegion.recommendedTurnsToBoss;
  const span = Math.max(1, targetTurn - startTurn);
  const progress = Math.max(0, turn - startTurn);
  const progressPercent = Math.min(100, Math.round((progress / span) * 100));

  return {
    region: undefeatedRegion,
    nextMilestoneTurn: targetTurn,
    turnsUntilBoss: Math.max(0, targetTurn - turn),
    progressPercent,
    isEndless: false,
    storyBossesDefeatedCount: STORY_BOSS_IDS.filter((id) => defeatedBossIds.includes(id)).length,
  };
}

export function createActiveBossForRegion(
  region: RegionDefinition,
  turn: number
): ActiveBossState {
  if (region.id === 'endless_abyss') {
    const abyssWave = Math.max(1, Math.floor((turn - 30) / 10));
    const scaledHp = region.boss.maxHp + (abyssWave - 1) * 55;
    return {
      id: `${region.boss.id}_w${abyssWave}`,
      regionId: 'endless_abyss',
      name: `${region.boss.name}・第 ${abyssWave} 階`,
      title: region.boss.title,
      hp: scaledHp,
      maxHp: scaledHp,
      attackPower: region.boss.attackPower + (abyssWave - 1) * 3,
      rewardCoins: region.boss.rewardCoins + (abyssWave - 1) * 30,
      rewardItem: region.boss.rewardItem,
      trufflePointsReward: region.boss.trufflePointsReward + (abyssWave - 1) * 8,
    };
  }

  return {
    id: region.boss.id,
    regionId: region.id,
    name: region.boss.name,
    title: region.boss.title,
    hp: region.boss.maxHp,
    maxHp: region.boss.maxHp,
    attackPower: region.boss.attackPower,
    rewardCoins: region.boss.rewardCoins,
    rewardItem: region.boss.rewardItem,
    trufflePointsReward: region.boss.trufflePointsReward,
  };
}

export function calculatePlayerBossDamage(params: {
  actionText: string;
  attackBonus: number;
  level: number;
  critBonus?: number;
  rng?: () => number;
}): { damage: number; isCrit: boolean } {
  const rng = params.rng ?? Math.random;
  const lower = params.actionText.toLowerCase();
  const isOffensive =
    /(攻擊|揮|敲|砸|衝|撞|砍|刺|咬|丟|炸|踢|全力|決戰|討伐|boss|火|辣)/.test(lower);
  const baseRoll = 20 + Math.floor(rng() * 11); // 20 - 30
  const equipScale = params.attackBonus * 5;
  const levelScale = Math.max(0, params.level - 1) * 3;
  const stanceBonus = isOffensive ? 8 : 0;
  const isCrit = rng() < Math.min(0.65, 0.22 + (params.critBonus ?? 0));
  const raw = baseRoll + equipScale + levelScale + stanceBonus;
  return {
    damage: isCrit ? Math.round(raw * 1.45) : raw,
    isCrit,
  };
}

export function resolveBossTurnPreCall(params: {
  isStart: boolean;
  nextTurnNumber: number;
  defeatedBossIds: string[];
  currentBoss: ActiveBossState | null;
}): {
  bossBeforeTurn: ActiveBossState | null;
  isNewlySpawned: boolean;
  region: RegionDefinition;
} {
  if (params.isStart) {
    return {
      bossBeforeTurn: null,
      isNewlySpawned: false,
      region: WORLD_REGIONS[0],
    };
  }

  if (params.currentBoss) {
    return {
      bossBeforeTurn: params.currentBoss,
      isNewlySpawned: false,
      region: getRegionById(params.currentBoss.regionId),
    };
  }

  const state = getCurrentRegionState(
    params.defeatedBossIds,
    params.nextTurnNumber,
    null
  );

  const shouldSpawn = state.isEndless
    ? params.nextTurnNumber >= 40 && params.nextTurnNumber % 10 === 0
    : params.nextTurnNumber >= state.region.recommendedTurnsToBoss;

  if (shouldSpawn) {
    return {
      bossBeforeTurn: createActiveBossForRegion(state.region, params.nextTurnNumber),
      isNewlySpawned: true,
      region: state.region,
    };
  }

  return {
    bossBeforeTurn: null,
    isNewlySpawned: false,
    region: state.region,
  };
}

export function resolveBossTurnPostCall(params: {
  bossBeforeTurn: ActiveBossState | null;
  isNewlySpawned: boolean;
  region: RegionDefinition;
  defeatedBossIds: string[];
  actionText: string;
  attackBonus: number;
  level: number;
  critBonus?: number;
}): {
  nextBoss: ActiveBossState | null;
  nextDefeatedBossIds: string[];
  bossEvent: BossLogEvent | null;
  rewardCoins: number;
  rewardItem: string | null;
  trufflePointsEarned: number;
} {
  const boss = params.bossBeforeTurn;
  if (!boss) {
    return {
      nextBoss: null,
      nextDefeatedBossIds: params.defeatedBossIds,
      bossEvent: null,
      rewardCoins: 0,
      rewardItem: null,
      trufflePointsEarned: 0,
    };
  }

  const { damage, isCrit } = calculatePlayerBossDamage({
    actionText: params.actionText,
    attackBonus: params.attackBonus,
    level: params.level,
    critBonus: params.critBonus,
  });

  const hpAfter = Math.max(0, boss.hp - damage);

  if (hpAfter <= 0) {
    const nextDefeated = Array.from(new Set([...params.defeatedBossIds, boss.id]));
    const nextState = getCurrentRegionState(nextDefeated, 999999, null);
    const nextRegionName =
      nextState.region.id !== params.region.id ? nextState.region.name : null;

    return {
      nextBoss: null,
      nextDefeatedBossIds: nextDefeated,
      bossEvent: {
        type: 'defeated',
        bossName: boss.name,
        bossTitle: boss.title,
        regionName: params.region.name,
        damageDealt: damage,
        isCrit,
        bossHpAfter: 0,
        bossMaxHp: boss.maxHp,
        rewardCoins: boss.rewardCoins,
        rewardItem: boss.rewardItem,
        trufflePointsEarned: boss.trufflePointsReward,
        nextRegionName,
      },
      rewardCoins: boss.rewardCoins,
      rewardItem: boss.rewardItem,
      trufflePointsEarned: boss.trufflePointsReward,
    };
  }

  const updatedBoss: ActiveBossState = {
    ...boss,
    hp: hpAfter,
  };

  return {
    nextBoss: updatedBoss,
    nextDefeatedBossIds: params.defeatedBossIds,
    bossEvent: {
      type: params.isNewlySpawned ? 'spawned' : 'hit',
      bossName: boss.name,
      bossTitle: boss.title,
      regionName: params.region.name,
      damageDealt: damage,
      isCrit,
      bossHpAfter: hpAfter,
      bossMaxHp: boss.maxHp,
    },
    rewardCoins: 0,
    rewardItem: null,
    trufflePointsEarned: 0,
  };
}
