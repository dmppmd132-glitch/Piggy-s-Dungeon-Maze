import type { ActiveQuest } from '../types/game';

export interface QuestTemplate {
  id: string;
  npcName: string;
  title: string;
  description: string;
  targetItem: string;
  targetKeywords: string[];
  rewardCoins: number;
  rewardItem: string | null;
  clueHint: string;
}

export const NPC_QUEST_POOL: QuestTemplate[] = [
  {
    id: 'goblin_lost_salt',
    npcName: '哥布林大廚「鍋蓋」',
    title: '幫哥布林找回遺失的鹽巴',
    description:
      '哥布林大廚正對著無味的大鍋哀號，他的「遺失的魔法岩鹽」被調皮泥巴精靈叼走了，請小豬幫忙找回來！',
    targetItem: '遺失的魔法岩鹽',
    targetKeywords: ['岩鹽', '鹽巴', '海鹽', '鹽'],
    rewardCoins: 45,
    rewardItem: '秘製黃金鍋鏟',
    clueHint: '沿著廚房外散落的白色鹽粒腳印搜查',
  },
  {
    id: 'squirrel_lost_letter',
    npcName: '迷糊松鼠郵差「栗子」',
    title: '尋回遺落的森林掛號信',
    description:
      '松鼠郵差在樹冠打滑摔了一跤，把要交給長老的「密封橡果信件」掉在林間，拜託小豬幫忙撿回。',
    targetItem: '密封橡果信件',
    targetKeywords: ['橡果信件', '掛號信', '信件', '包裹'],
    rewardCoins: 38,
    rewardItem: '松露尋寶羅盤',
    clueHint: '翻找路邊落葉堆與空心樹洞尋找信件',
  },
  {
    id: 'turtle_mint_tea',
    npcName: '老烏龜村長「慢吞吞」',
    title: '採集晨露薄荷茶葉',
    description:
      '老村長熬夜算帳腰痠背痛，急需「閃亮薄荷茶葉」泡一壺提神熱茶，答應打開私房金庫答謝。',
    targetItem: '閃亮薄荷茶葉',
    targetKeywords: ['薄荷茶葉', '茶葉', '薄荷'],
    rewardCoins: 55,
    rewardItem: '村長私房蜂蜜餅',
    clueHint: '在潮濕苔蘚岩石旁尋找散發清香的薄荷',
  },
  {
    id: 'badger_pocket_watch',
    npcName: '泥巴獾商人「亮晶晶」',
    title: '打撈泥潭裡的銀懷錶',
    description:
      '愛乾淨的泥巴獾把祖傳「沾泥銀懷錶」掉進泥漿池裡，不敢弄髒毛皮，願出重金請小豬代勞撈回。',
    targetItem: '沾泥銀懷錶',
    targetKeywords: ['銀懷錶', '懷錶', '手錶'],
    rewardCoins: 65,
    rewardItem: '純金泥巴幸運幣',
    clueHint: '用工具在冒泡泥漿池邊仔細打撈金屬閃光',
  },
  {
    id: 'owl_glow_mushroom',
    npcName: '失眠貓頭鷹學者「咕嚕」',
    title: '尋找樹洞裡的發光安神菇',
    description:
      '貓頭鷹學者已經三天沒睡覺了，拜託小豬替他採來一朵「發光安神菇」調配助眠藥水。',
    targetItem: '發光安神菇',
    targetKeywords: ['安神菇', '發光菇', '夜光菇'],
    rewardCoins: 42,
    rewardItem: '月光魔法護符',
    clueHint: '在陰涼老樹根的陰影處搜尋發光的菇類',
  },
];

export function matchesQuestTargetItem(itemName: string, quest: ActiveQuest): boolean {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === quest.targetItem.toLowerCase()) return true;
  return quest.targetKeywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

export function findQuestTargetIndex(inventory: string[], quest: ActiveQuest | null): number {
  if (!quest) return -1;
  return inventory.findIndex((item) => matchesQuestTargetItem(item, quest));
}

export function isQuestSearchAction(action: string, quest: ActiveQuest | null): boolean {
  if (!quest) return false;
  const text = action.trim().toLowerCase();
  if (!text) return false;
  if (
    text.includes(quest.targetItem.toLowerCase()) ||
    text.includes(quest.clueHint.toLowerCase()) ||
    text.includes('委託') ||
    text.includes('線索')
  ) {
    return true;
  }
  const hasSearchVerb =
    text.includes('找') ||
    text.includes('尋') ||
    text.includes('搜') ||
    text.includes('撈') ||
    text.includes('採') ||
    text.includes('挖');
  const hasKeyword = quest.targetKeywords.some((kw) => text.includes(kw.toLowerCase()));
  return hasSearchVerb && hasKeyword;
}

export function isQuestDeliveryAction(action: string, quest: ActiveQuest | null): boolean {
  if (!quest) return false;
  const text = action.trim().toLowerCase();
  if (!text) return false;
  const hasDeliverVerb =
    text.includes('交給') ||
    text.includes('交付') ||
    text.includes('歸還') ||
    text.includes('還給') ||
    text.includes('送給') ||
    text.includes('領賞') ||
    text.includes('完成委託');
  const mentionsNpcOrQuest =
    text.includes('委託') ||
    text.includes(quest.targetItem.toLowerCase()) ||
    quest.targetKeywords.some((kw) => text.includes(kw.toLowerCase())) ||
    text.includes(quest.npcName.slice(0, 3).toLowerCase());
  return hasDeliverVerb && mentionsNpcOrQuest;
}

export function rollNewQuest(
  turn: number,
  currentQuest: ActiveQuest | null,
  completedQuestIds: string[],
  rng: () => number = Math.random
): ActiveQuest | null {
  if (currentQuest || turn < 2) return null;

  // Higher trigger probability on turn 2 so players reliably experience NPC commissions early
  const triggerChance = turn === 2 ? 0.65 : 0.4;
  if (rng() > triggerChance) return null;

  const remaining = NPC_QUEST_POOL.filter((q) => !completedQuestIds.includes(q.id));
  const candidates = remaining.length > 0 ? remaining : NPC_QUEST_POOL;
  const chosen = candidates[Math.floor(rng() * candidates.length)];

  return {
    ...chosen,
    acceptedTurn: turn,
  };
}
