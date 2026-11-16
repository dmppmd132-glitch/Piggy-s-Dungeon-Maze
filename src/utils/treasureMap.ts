export const MAP_FRAGMENT_NAME = '泛黃藏寶圖碎片';
export const COMPLETE_MAP_NAME = '完整泥巴藏寶圖';
export const MAP_FRAGMENTS_REQUIRED = 3;
export const TREASURE_DIG_CHARGES = 3;

export type TreasureCellKind = 'grand_chest' | 'snack_stash' | 'mud_trap' | 'soil';

export interface TreasureCell {
  index: number;
  row: number;
  col: number;
  terrainLabel: string;
  kind: TreasureCellKind;
  dug: boolean;
  coins: number;
  trufflePoints: number;
  hpDelta: number;
  item: string | null;
  hintText: string;
}

const TERRAIN_LABELS = [
  '泥坑草叢',
  '老橡樹根',
  '石橋泥堆',
  '蘑菇圓環',
  '溪邊軟泥',
  '破爛木箱',
  '松露土丘',
  '苔蘚岩縫',
  '營火灰堆',
];

const GRAND_CHEST_ITEMS = [
  '發光松露碎片',
  '黃金陳年起司塊',
  '千年森林泉水',
  '白銀湯匙',
];

const SNACK_STASH_ITEMS = [
  '香煎培根碎',
  '月光草香菇',
  '烤橡果',
  '雪山薄荷藥草束',
];

export function countMapFragments(inventory: string[]): number {
  return inventory.filter((item) => item === MAP_FRAGMENT_NAME).length;
}

export function countCompleteMaps(inventory: string[]): number {
  return inventory.filter((item) => item === COMPLETE_MAP_NAME).length;
}

export function canCraftCompleteMap(inventory: string[]): boolean {
  return countMapFragments(inventory) >= MAP_FRAGMENTS_REQUIRED;
}

export function craftCompleteTreasureMap(inventory: string[]): string[] | null {
  if (!canCraftCompleteMap(inventory)) return null;
  const next = [...inventory];
  let removed = 0;
  const filtered: string[] = [];
  for (const item of next) {
    if (item === MAP_FRAGMENT_NAME && removed < MAP_FRAGMENTS_REQUIRED) {
      removed += 1;
    } else {
      filtered.push(item);
    }
  }
  filtered.push(COMPLETE_MAP_NAME);
  return filtered;
}

export function consumeOneCompleteMap(inventory: string[]): string[] | null {
  const idx = inventory.indexOf(COMPLETE_MAP_NAME);
  if (idx === -1) return null;
  const next = [...inventory];
  next.splice(idx, 1);
  return next;
}

export function maybeRollMapFragment(
  turn: number,
  bonusChance = 0,
  rng: () => number = Math.random
): string | null {
  if (turn < 2) return null;
  const chance = Math.min(0.4, 0.14 + Math.max(0, bonusChance));
  return rng() < chance ? MAP_FRAGMENT_NAME : null;
}

export function generateTreasureGrid(rng: () => number = Math.random): TreasureCell[] {
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => rng() - 0.5);
  const grandIdx = indices[0];
  const snackIdx = indices[1];
  const trapIdx = indices[2];

  const grandRow = Math.floor(grandIdx / 3);
  const grandCol = grandIdx % 3;

  return Array.from({ length: 9 }, (_, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const distance = Math.abs(row - grandRow) + Math.abs(col - grandCol);
    const terrainLabel = TERRAIN_LABELS[index] ?? `泥地 #${index + 1}`;

    if (index === grandIdx) {
      const grandItem =
        GRAND_CHEST_ITEMS[Math.floor(rng() * GRAND_CHEST_ITEMS.length)] ?? '發光松露碎片';
      return {
        index,
        row,
        col,
        terrainLabel,
        kind: 'grand_chest',
        dug: false,
        coins: 36,
        trufflePoints: 8,
        hpDelta: 0,
        item: grandItem,
        hintText: `挖到黃金松露秘寶箱！入手 +36 幣、+8 松露點與「${grandItem}」！`,
      };
    }

    if (index === snackIdx) {
      const snackItem =
        SNACK_STASH_ITEMS[Math.floor(rng() * SNACK_STASH_ITEMS.length)] ?? '烤橡果';
      return {
        index,
        row,
        col,
        terrainLabel,
        kind: 'snack_stash',
        dug: false,
        coins: 15,
        trufflePoints: 2,
        hpDelta: 0,
        item: snackItem,
        hintText: `挖出松鼠私藏的零食袋！入手 +15 幣、+2 松露點與「${snackItem}」！`,
      };
    }

    if (index === trapIdx) {
      return {
        index,
        row,
        col,
        terrainLabel,
        kind: 'mud_trap',
        dug: false,
        coins: 6,
        trufflePoints: 0,
        hpDelta: -5,
        item: null,
        hintText:
          distance <= 1
            ? '被泥巴蟹鉗到豬蹄（-5 HP）但摸回 +6 幣！且鼻子感應寶箱就在相鄰格！'
            : '踩進螃蟹小泥坑（-5 HP），勉強撈出 +6 枚銅幣！',
      };
    }

    const scentHint =
      distance === 1
        ? '豬鼻劇烈抽動！大寶箱就在上下左右相鄰一格！'
        : distance === 2
        ? '聞到淡淡松露香，距離大寶箱約 2 步。'
        : '只有蚯蚓跟濕泥巴，大寶箱在更遠處。';

    return {
      index,
      row,
      col,
      terrainLabel,
      kind: 'soil',
      dug: false,
      coins: 4,
      trufflePoints: 0,
      hpDelta: 0,
      item: null,
      hintText: `翻開泥土撿到 +4 幣 · ${scentHint}`,
    };
  });
}
