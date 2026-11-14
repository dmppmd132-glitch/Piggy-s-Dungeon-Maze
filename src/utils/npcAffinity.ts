import type { NpcId } from '../types/game';

export interface NpcProfile {
  id: NpcId;
  name: string;
  role: string;
  keywords: string[];
  initialAffinity: number;
  cluePool: string[];
}

export interface AffinityTierInfo {
  id: 'hostile' | 'neutral' | 'friendly' | 'trusted';
  label: string;
  color: string;
  discountRate: number;
  perkLabel: string;
}

export const MUD_KINGDOM_NPCS: NpcProfile[] = [
  {
    id: 'goblin_chef',
    name: '哥布林大廚「鍋蓋」',
    role: '森林廚房料理師',
    keywords: ['哥布林', '鍋蓋', '大廚', '廚師'],
    initialAffinity: 35,
    cluePool: [
      '鍋蓋偷偷壓低聲音：「午夜松露洞穴南邊的腐葉堆裡，最近常飄出黃金黑松露的奶油香氣！」',
      '鍋蓋指了指湯鍋旁：「把森林野菇跟平底鍋一鍵合成，做出來的香煎野菇能補超多飽食度喔！」',
    ],
  },
  {
    id: 'squirrel_postman',
    name: '迷糊松鼠郵差「栗子」',
    role: '林間快遞與情報員',
    keywords: ['松鼠', '栗子', '郵差'],
    initialAffinity: 40,
    cluePool: [
      '栗子塞給你一張折角字條：「東邊空心老橡樹常有旅人遺落的空瓶與點心，路過記得用鼻子拱一拱！」',
      '栗子悄悄說：「白天視野最好，沿著草叢找路邊驚喜最容易撿到合成材料！」',
    ],
  },
  {
    id: 'turtle_mayor',
    name: '老烏龜村長「慢吞吞」',
    role: '泥巴村長者與金庫守護者',
    keywords: ['烏龜', '慢吞吞', '村長'],
    initialAffinity: 40,
    cluePool: [
      '慢吞吞推了推眼鏡：「大野狼強盜最愛在黃昏與夜晚出沒，天黑前記得把武器或鍋蓋裝在手上！」',
      '慢吞吞點頭提示：「完成村民的委託任務，一次就能拿到大量豬豬幣跟稀有裝備喔。」',
    ],
  },
  {
    id: 'badger_merchant',
    name: '泥巴獾商人「亮晶晶」',
    role: '潔癖行腳雜貨商',
    keywords: ['泥巴獾', '亮晶晶', '商人', '雜貨'],
    initialAffinity: 30,
    cluePool: [
      '亮晶晶擦拭著單片眼鏡：「『空的瓶子』配『森林泉水』或『草藥』能一鍵合成高級補品，別單獨丟掉！」',
      '亮晶晶小聲報明牌：「把幸運飾品或羅盤裝進副手，交易或挖寶時總能多賺幾枚豬豬幣！」',
    ],
  },
  {
    id: 'owl_scholar',
    name: '失眠貓頭鷹學者「咕嚕」',
    role: '草藥與松露生態學者',
    keywords: ['貓頭鷹', '咕嚕', '學者'],
    initialAffinity: 35,
    cluePool: [
      '咕嚕眨了眨大眼睛：「傳說中的『黃金黑松露』在秋收與清晨微光下最容易現身，記得往深處泥沼洞窟探索！」',
      '咕嚕翻開筆記本：「點出尋寶嗅覺技能樹，每次冒險都有機會直接多嗅出額外道具。」',
    ],
  },
];

export type NpcAffinityMap = Record<NpcId, number>;

export function createInitialNpcAffinities(): NpcAffinityMap {
  return {
    goblin_chef: 35,
    squirrel_postman: 40,
    turtle_mayor: 40,
    badger_merchant: 30,
    owl_scholar: 35,
  };
}

export function normalizeNpcAffinities(raw: unknown): NpcAffinityMap {
  const base = createInitialNpcAffinities();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<Record<NpcId, unknown>>;
  for (const npc of MUD_KINGDOM_NPCS) {
    const val = obj[npc.id];
    if (typeof val === 'number' && Number.isFinite(val)) {
      base[npc.id] = Math.max(0, Math.min(100, Math.round(val)));
    }
  }
  return base;
}

export function getAffinityTier(affinity: number): AffinityTierInfo {
  if (affinity >= 70) {
    return {
      id: 'trusted',
      label: '莫逆之交',
      color: '#ffd95a',
      discountRate: 0.25,
      perkLabel: '交易75折＋主動線索',
    };
  }
  if (affinity >= 45) {
    return {
      id: 'friendly',
      label: '友善夥伴',
      color: '#9fd67a',
      discountRate: 0.1,
      perkLabel: '交易9折',
    };
  }
  if (affinity >= 20) {
    return {
      id: 'neutral',
      label: '點頭之交',
      color: '#cbb89e',
      discountRate: 0,
      perkLabel: '一般往來',
    };
  }
  return {
    id: 'hostile',
    label: '警戒疏遠',
    color: '#ff7b6b',
    discountRate: 0,
    perkLabel: '態度冷淡',
  };
}

export function getNpcById(npcId: NpcId): NpcProfile | undefined {
  return MUD_KINGDOM_NPCS.find((n) => n.id === npcId);
}

export function matchNpcFromText(...texts: Array<string | null | undefined>): NpcProfile | null {
  const combined = texts
    .filter((t): t is string => Boolean(t && t.trim()))
    .join(' ')
    .toLowerCase();
  if (!combined) return null;

  for (const npc of MUD_KINGDOM_NPCS) {
    if (npc.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return npc;
    }
  }
  return null;
}

export function inferFallbackAffinityDelta(action: string, story: string): number {
  const combined = `${action} ${story}`.toLowerCase();
  const friendlySignals = [
    '幫',
    '送',
    '請吃',
    '分享',
    '稱讚',
    '誇獎',
    '聊天',
    '打招呼',
    '買',
    '交易',
    '謝謝',
    '打聽',
    '拜訪',
    '交給',
  ];
  const hostileSignals = ['搶', '偷', '打', '攻擊', '罵', '嘲笑', '踹', '騙', '砸'];

  if (hostileSignals.some((w) => combined.includes(w))) return -8;
  if (friendlySignals.some((w) => combined.includes(w))) return 5;
  return 0;
}

export function calculateTradeDiscountSavings(
  rawCoinsChange: number,
  affinity: number
): number {
  if (rawCoinsChange >= 0) return 0;
  const tier = getAffinityTier(affinity);
  if (tier.discountRate <= 0) return 0;
  const spent = Math.abs(rawCoinsChange);
  if (spent < 2) return 0;
  return Math.max(1, Math.round(spent * tier.discountRate));
}

export function pickNpcClue(
  npc: NpcProfile,
  affinity: number,
  actionText: string,
  rng: () => number = Math.random
): string | null {
  if (affinity < 70) return null;
  const askingClue =
    actionText.includes('線索') ||
    actionText.includes('情報') ||
    actionText.includes('打聽');
  // Always give a clue if explicitly asking, or 60% chance spontaneously on high-affinity interaction
  if (!askingClue && rng() > 0.6) return null;
  return npc.cluePool[Math.floor(rng() * npc.cluePool.length)];
}
