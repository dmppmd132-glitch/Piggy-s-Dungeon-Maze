import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  turn: number;
  coins: number;
  titleCount: number;
  bestTitle: string;
  foundTruffle: boolean;
}

export interface ScoreParams {
  turn: number;
  coins: number;
  titleCount: number;
  foundTruffle: boolean;
  hp: number;
}

export function calculateAdventureScore({
  turn,
  coins,
  titleCount,
  foundTruffle,
  hp,
}: ScoreParams): number {
  if (turn <= 0) return 0;
  const raw =
    turn * 25 +
    Math.max(0, coins) * 3 +
    Math.max(0, titleCount) * 100 +
    (foundTruffle ? 500 : 0) +
    (hp > 0 ? hp : 0);
  return Math.max(0, Math.min(1000000, Math.trunc(raw)));
}

export const PLAYER_NICKNAME_STORAGE_KEY = 'mud_kingdom_player_nickname_v1';

export function sanitizeDisplayName(name: string): string {
  return name.trim().slice(0, 40);
}

export function loadSavedNickname(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(PLAYER_NICKNAME_STORAGE_KEY);
    return typeof raw === 'string' ? sanitizeDisplayName(raw) : '';
  } catch {
    return '';
  }
}

export function saveNickname(name: string): string {
  const clean = sanitizeDisplayName(name);
  if (typeof window !== 'undefined') {
    try {
      if (clean) {
        window.localStorage.setItem(PLAYER_NICKNAME_STORAGE_KEY, clean);
      } else {
        window.localStorage.removeItem(PLAYER_NICKNAME_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
  return clean;
}

export function resolvePlayerDisplayName(user: User, customDisplayName?: string): string {
  const custom = customDisplayName ? sanitizeDisplayName(customDisplayName) : '';
  if (custom) return custom;
  const fallback = sanitizeDisplayName(
    user.displayName || user.email?.split('@')[0] || '無名小豬'
  );
  return fallback || '無名小豬';
}

export interface SubmitScoreInput {
  user: User;
  score: number;
  turn: number;
  coins: number;
  titleCount: number;
  bestTitle: string;
  foundTruffle: boolean;
  customDisplayName?: string;
}

export async function submitLeaderboardScore({
  user,
  score,
  turn,
  coins,
  titleCount,
  bestTitle,
  foundTruffle,
  customDisplayName,
}: SubmitScoreInput): Promise<{ updated: boolean; nicknameUpdated: boolean; bestScore: number }> {
  const safeTurn = Math.max(1, Math.min(10000, Math.trunc(turn)));
  const safeScore = Math.max(0, Math.min(1000000, Math.trunc(score)));
  const safeCoins = Math.max(0, Math.min(100000, Math.trunc(coins)));
  const safeTitleCount = Math.max(0, Math.min(20, Math.trunc(titleCount)));
  const safeDisplayName = resolvePlayerDisplayName(user, customDisplayName);
  const safeBestTitle = bestTitle.trim().slice(0, 40);

  const docPath = `leaderboard/${user.uid}`;
  const ref = doc(db, 'leaderboard', user.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        uid: user.uid,
        displayName: safeDisplayName,
        score: safeScore,
        turn: safeTurn,
        coins: safeCoins,
        titleCount: safeTitleCount,
        bestTitle: safeBestTitle,
        foundTruffle: Boolean(foundTruffle),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { updated: true, nicknameUpdated: false, bestScore: safeScore };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  }

  const prevData = existingSnap.data();
  const prevScore = typeof prevData?.score === 'number' ? prevData.score : 0;
  const prevName = typeof prevData?.displayName === 'string' ? prevData.displayName : '';

  if (safeScore < prevScore) {
    if (customDisplayName && sanitizeDisplayName(customDisplayName) && prevName !== safeDisplayName) {
      try {
        await updateDoc(ref, {
          displayName: safeDisplayName,
          updatedAt: serverTimestamp(),
        });
        return { updated: false, nicknameUpdated: true, bestScore: prevScore };
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
    }
    return { updated: false, nicknameUpdated: false, bestScore: prevScore };
  }

  try {
    await updateDoc(ref, {
      displayName: safeDisplayName,
      score: safeScore,
      turn: safeTurn,
      coins: safeCoins,
      titleCount: safeTitleCount,
      bestTitle: safeBestTitle,
      foundTruffle: Boolean(foundTruffle),
      updatedAt: serverTimestamp(),
    });
    return { updated: true, nicknameUpdated: prevName !== safeDisplayName, bestScore: safeScore };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

export async function updateLeaderboardNickname(
  user: User,
  nickname: string
): Promise<{ updated: boolean; hasEntry: boolean; displayName: string }> {
  const safeDisplayName = resolvePlayerDisplayName(user, nickname);
  const docPath = `leaderboard/${user.uid}`;
  const ref = doc(db, 'leaderboard', user.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }

  if (!existingSnap.exists()) {
    return { updated: false, hasEntry: false, displayName: safeDisplayName };
  }

  try {
    await updateDoc(ref, {
      displayName: safeDisplayName,
      updatedAt: serverTimestamp(),
    });
    return { updated: true, hasEntry: true, displayName: safeDisplayName };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

export function subscribeLeaderboard(
  onData: (entries: LeaderboardEntry[]) => void,
  onError: (errMsg: string) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid ?? d.id),
          displayName: String(data.displayName ?? '無名小豬'),
          score: Number(data.score ?? 0),
          turn: Number(data.turn ?? 1),
          coins: Number(data.coins ?? 0),
          titleCount: Number(data.titleCount ?? 0),
          bestTitle: String(data.bestTitle ?? ''),
          foundTruffle: Boolean(data.foundTruffle),
        };
      });
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped.message : '無法讀取排行榜資料');
      }
    }
  );
}
