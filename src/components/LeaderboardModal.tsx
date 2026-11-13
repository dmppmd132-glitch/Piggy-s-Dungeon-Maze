import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Check, LogIn, LogOut, Trophy, Upload, UserPen, X } from 'lucide-react';
import { signInWithGoogle, signOutPlayer } from '../firebase';
import {
  subscribeLeaderboard,
  submitLeaderboardScore,
  updateLeaderboardNickname,
  type LeaderboardEntry,
} from '../utils/leaderboard';
import { PixelTrophyIcon } from './PixelSprites';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  playerNickname: string;
  onNicknameChange: (name: string) => void;
  currentScore: number;
  turn: number;
  coins: number;
  titleCount: number;
  bestTitle: string;
  foundTruffle: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  user,
  playerNickname,
  onNicknameChange,
  currentScore,
  turn,
  coins,
  titleCount,
  bestTitle,
  foundTruffle,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [savingName, setSavingName] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>(playerNickname);

  useEffect(() => {
    if (!isOpen) return;
    setDraftName(playerNickname);
  }, [isOpen, playerNickname]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingList(true);
    setListError(null);
    const unsub = subscribeLeaderboard(
      (data) => {
        setEntries(data);
        setLoadingList(false);
      },
      (msg) => {
        setListError(msg);
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setStatusNote(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登入失敗，請稍後再試。';
      setStatusNote(`登入未完成：${msg}`);
    }
  };

  const handleLogout = async () => {
    setStatusNote(null);
    await signOutPlayer();
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftName.trim().slice(0, 40);
    onNicknameChange(cleaned);
    setDraftName(cleaned);
    setStatusNote(null);

    if (!user) {
      setStatusNote(
        cleaned
          ? `已記住暱稱「${cleaned}」，Google 登入後將以此名稱登上排行榜！`
          : '已清除自訂暱稱，登入後將預設使用 Google 帳號名稱。'
      );
      return;
    }

    setSavingName(true);
    try {
      const res = await updateLeaderboardNickname(user, cleaned);
      if (res.hasEntry) {
        setStatusNote(`已將你在排行榜上的名稱更新為「${res.displayName}」！`);
      } else {
        setStatusNote(`已設定暱稱「${res.displayName}」，開始冒險並登錄積分後就會顯示於榜上！`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '更新名稱失敗';
      setStatusNote(`更新名稱失敗：${msg}`);
    } finally {
      setSavingName(false);
    }
  };

  const handleManualSync = async () => {
    if (!user || turn <= 0 || syncing) return;
    const cleaned = draftName.trim().slice(0, 40);
    onNicknameChange(cleaned);
    setSyncing(true);
    setStatusNote(null);
    try {
      const res = await submitLeaderboardScore({
        user,
        score: currentScore,
        turn,
        coins,
        titleCount,
        bestTitle,
        foundTruffle,
        customDisplayName: cleaned,
      });
      if (res.updated) {
        setStatusNote(`已更新你的個人最高積分紀錄（${res.bestScore} 分）！`);
      } else if (res.nicknameUpdated) {
        setStatusNote(
          `已同步更新排行榜暱稱！本局 ${currentScore} 分，歷史最高分維持 ${res.bestScore} 分。`
        );
      } else {
        setStatusNote(`本局 ${currentScore} 分，尚未超過你的歷史最高分（${res.bestScore} 分）。`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上傳積分失敗';
      setStatusNote(`上傳失敗：${msg}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
    >
      <div className="pixel-panel w-full max-w-2xl max-h-[88vh] flex flex-col gap-4 p-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#4a3525] pb-3">
          <div className="flex items-center gap-2.5">
            <PixelTrophyIcon className="w-6 h-6 shrink-0" />
            <div>
              <h2 id="leaderboard-modal-title" className="font-pixel text-lg text-[#ffd95a]">
                泥巴王國英雄排行榜
              </h2>
              <p className="text-xs text-[#b8a58d]">
                積分計算：回合 × 25 + 豬豬幣 × 3 + 隱藏稱號 × 100 + 剩餘 HP（尋獲黃金黑松露 +500）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-[#33251c] hover:bg-[#443125] p-2 text-[#f5ebd9] cursor-pointer shrink-0"
            aria-label="關閉排行榜"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth & Personal Score Bar */}
        <div className="pixel-panel-inner p-3.5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs text-[#b8a58d]">
                {user
                  ? `已驗證玩家：${playerNickname || user.displayName || '泥巴勇者'}`
                  : '尚未登入（登入驗證後即可將自訂暱稱與最高積分登錄排行榜）'}
              </div>
              <div className="font-num text-sm text-[#f5ebd9]">
                本局目前積分：<span className="text-[#ffd95a] font-bold">{currentScore}</span> 分
                {turn > 0 && (
                  <span className="text-xs text-[#c7b49a] ml-2">
                    （第 {turn} 回合 · {coins} 幣 · {titleCount} 稱號）
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={turn <= 0 || syncing}
                    className="pixel-btn pixel-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{syncing ? '上傳中...' : '登錄 / 更新積分'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-3 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>登出</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="pixel-btn pixel-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>使用 Google 登入參戰</span>
                </button>
              )}
            </div>
          </div>

          {/* Custom Leaderboard Display Name Form */}
          <form
            onSubmit={handleSaveNickname}
            className="pt-2.5 border-t border-[#38281c] flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <label
              htmlFor="leaderboard-nickname-input"
              className="text-xs text-[#cbb89e] flex items-center gap-1.5 shrink-0"
            >
              <UserPen className="w-3.5 h-3.5 text-[#f3b562]" />
              <span>排行榜顯示名稱</span>
            </label>
            <div className="flex items-center gap-2 flex-1">
              <input
                id="leaderboard-nickname-input"
                type="text"
                maxLength={40}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={user?.displayName || '輸入你想顯示在排行榜的暱稱（最多 40 字）'}
                className="flex-1 min-w-0 bg-[#140e0b] border border-[#4a3525] px-2.5 py-1.5 text-xs text-[#f5ebd9] placeholder-[#7d6c58] focus:outline-none focus:border-[#f3b562]"
              />
              <button
                type="submit"
                disabled={savingName}
                className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#ffd95a] px-3 py-1.5 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingName ? '套用中...' : '套用名稱'}</span>
              </button>
            </div>
          </form>
        </div>

        {statusNote && (
          <div className="pixel-panel-inner border-[#d99b26] px-3 py-2 text-xs text-[#ffd95a]">
            {statusNote}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto rpg-scroll pixel-panel-inner p-3 min-h-[220px]">
          {loadingList ? (
            <div className="py-10 text-center text-sm text-[#c7b49a] font-pixel">
              正在讀取泥巴王國榜單...
            </div>
          ) : listError ? (
            <div className="py-8 text-center text-xs text-[#ff9688] break-all">
              讀取排行榜失敗：{listError}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Trophy className="w-8 h-8 text-[#8c6a4a] mx-auto" />
              <p className="text-sm text-[#cbb89e]">
                排行榜目前還是空的，快登入搶下泥巴王國第一名吧！
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-[#4a3525] text-[#b8a58d]">
                    <th className="py-2 px-2 font-medium">名次</th>
                    <th className="py-2 px-2 font-medium">玩家</th>
                    <th className="py-2 px-2 font-medium hidden sm:table-cell">代表稱號</th>
                    <th className="py-2 px-2 font-medium text-right">回合</th>
                    <th className="py-2 px-2 font-medium text-right">豬豬幣</th>
                    <th className="py-2 px-2 font-medium text-right">最高積分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#332419]">
                  {entries.map((entry, idx) => {
                    const rank = idx + 1;
                    const isMe = user?.uid === entry.uid;
                    const rankColor =
                      rank === 1
                        ? 'text-[#ffd95a]'
                        : rank === 2
                        ? 'text-[#d8dee9]'
                        : rank === 3
                        ? 'text-[#e0935e]'
                        : 'text-[#b8a58d]';
                    return (
                      <tr
                        key={entry.uid}
                        className={isMe ? 'bg-[#332615]' : 'hover:bg-[#221913]'}
                      >
                        <td className={`py-2.5 px-2 font-num font-bold ${rankColor}`}>
                          #{rank}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[#f5ebd9] flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{entry.displayName}</span>
                            {isMe && (
                              <span className="text-[11px] text-[#ffd95a] shrink-0">（你）</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9e8c77] sm:hidden">
                            {entry.bestTitle || (entry.foundTruffle ? '尋獲黃金黑松露' : '泥巴冒險豬')}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-xs text-[#cbb89e] hidden sm:table-cell">
                          {entry.foundTruffle
                            ? `${entry.bestTitle ? `${entry.bestTitle} · ` : ''}已尋獲松露`
                            : entry.bestTitle || '貪吃泥巴豬'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-num text-[#e0d2be]">
                          {entry.turn}
                        </td>
                        <td className="py-2.5 px-2 text-right font-num text-[#f5b041]">
                          {entry.coins}
                        </td>
                        <td className="py-2.5 px-2 text-right font-num font-bold text-[#ffd95a]">
                          {entry.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
