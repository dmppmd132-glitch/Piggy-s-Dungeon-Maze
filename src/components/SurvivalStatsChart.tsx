import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import type { LogEntry } from '../types/game';

interface SurvivalStatsChartProps {
  logs: LogEntry[];
  initialHp?: number;
  initialHunger?: number;
}

interface ChartPoint {
  label: string;
  turn: number;
  hp: number;
  hunger: number;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
}

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const hpItem = payload.find((p) => p.dataKey === 'hp');
  const hungerItem = payload.find((p) => p.dataKey === 'hunger');

  return (
    <div className="pixel-panel px-3 py-2 text-xs space-y-1">
      <div className="font-pixel text-[#ffd95a]">
        {label === '啟程' ? '啟程起點' : `第 ${label?.replace('R', '')} 回合`}
      </div>
      {hpItem && (
        <div className="font-num text-[#7ce06b] flex items-center justify-between gap-4">
          <span>生命值 (HP)</span>
          <span className="font-bold">{hpItem.value}/100</span>
        </div>
      )}
      {hungerItem && (
        <div className="font-num text-[#f5b041] flex items-center justify-between gap-4">
          <span>飽食度</span>
          <span className="font-bold">{hungerItem.value}/100</span>
        </div>
      )}
    </div>
  );
};

export const SurvivalStatsChart: React.FC<SurvivalStatsChartProps> = ({
  logs,
  initialHp = 100,
  initialHunger = 80,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const data: ChartPoint[] = useMemo(() => {
    if (logs.length === 0) return [];
    const points: ChartPoint[] = [
      {
        label: '啟程',
        turn: 0,
        hp: initialHp,
        hunger: initialHunger,
      },
    ];
    for (const entry of logs) {
      points.push({
        label: `R${entry.turn}`,
        turn: entry.turn,
        hp: entry.hpAfter,
        hunger: entry.hungerAfter,
      });
    }
    return points;
  }, [logs, initialHp, initialHunger]);

  return (
    <div className="pixel-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b-2 border-[#4a3525] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-[#f3b562] shrink-0" />
          <h2 className="font-pixel text-base text-[#f5ebd9] whitespace-nowrap">
            冒險數據看板
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#7ce06b]">
              <span className="inline-block w-2.5 h-2.5 bg-[#58b947]" aria-hidden="true" />
              <span>HP</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#f5b041]">
              <span className="inline-block w-2.5 h-2.5 bg-[#f5b041]" aria-hidden="true" />
              <span>飽食度</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="pixel-btn bg-[#33251c] hover:bg-[#443125] text-[#f5ebd9] px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
            aria-expanded={!collapsed}
          >
            <span>{collapsed ? '展開' : '收合'}</span>
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {data.length === 0 ? (
            <div className="pixel-panel-inner py-6 px-4 text-center text-xs text-[#9c8a74]">
              開始新冒險後，這裡會即時繪製每回合的 HP 與飽食度生存趨勢曲線。
            </div>
          ) : (
            <div className="pixel-panel-inner p-2.5 h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 2 }}>
                  <CartesianGrid stroke="#3a2a1e" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#8c7a65"
                    tick={{ fill: '#b8a58d', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#8c7a65"
                    tick={{ fill: '#b8a58d', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="hp"
                    name="生命值 (HP)"
                    stroke="#58b947"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#58b947', stroke: '#1a130f', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#7ce06b' }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="hunger"
                    name="飽食度"
                    stroke="#f5b041"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f5b041', stroke: '#1a130f', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#ffd95a' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};
