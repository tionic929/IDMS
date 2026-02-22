/**
 * TallyChart — Leaderboard-list layout
 * Replaces the BarChart with vertical scrollable rows:
 *   [rank badge] [dept initial circle] [dept name] [bar fill] [count]
 * This avoids the cramped X-axis label problem entirely.
 * Bar click still fires onBarClick for the modal.
 */
import React from 'react';
import { ChartContainer } from './ChartContainer';
import type { Department } from '../../types/analytics';
import { ArrowUpRight, BarChart3, Medal } from 'lucide-react';

// Static logo imports (Vite-safe)
import abLogo from '../../assets/dept_logo/ab.webp';
import becLogo from '../../assets/dept_logo/bec.webp';
import bsbaLogo from '../../assets/dept_logo/bsba.webp';
import bscrimLogo from '../../assets/dept_logo/bscrim.webp';
import bsedLogo from '../../assets/dept_logo/bsed.webp';
import bsgeLogo from '../../assets/dept_logo/bsge.webp';
import bshmLogo from '../../assets/dept_logo/bshm.webp';
import bsitLogo from '../../assets/dept_logo/bsit.webp';
import bsnLogo from '../../assets/dept_logo/bsn.webp';
import colaLogo from '../../assets/dept_logo/cola.webp';
import masteralLogo from '../../assets/dept_logo/masteral.webp';
import midwiferyLogo from '../../assets/dept_logo/midwifery.webp';

const LOGO_MAP: Record<string, string> = {
  AB: abLogo, BEC: becLogo, BSBA: bsbaLogo, BSCRIM: bscrimLogo,
  BSED: bsedLogo, BSGE: bsgeLogo, BSHM: bshmLogo, BSIT: bsitLogo,
  BSN: bsnLogo, COLA: colaLogo, MASTERAL: masteralLogo, MIDWIFERY: midwiferyLogo,
};

// Color pool for bar fills
const BAR_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export const TallyChart: React.FC<{
  data: Department[];
  onViewDetails?: () => void;
  onBarClick?: (deptName: string) => void;
}> = ({ data, onViewDetails, onBarClick }) => {

  if (!data || data.length === 0) {
    return (
      <ChartContainer title="Departmental Tallies" accent="bg-indigo-500">
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2 py-12">
          <BarChart3 size={28} className="opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest">No Records Found</p>
        </div>
      </ChartContainer>
    );
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const maxVal = sorted[0]?.total || 1;
  // Show up to 8 rows in the scrollable list (internal height is fixed)
  const visible = sorted.slice(0, 8);

  return (
    <ChartContainer
      title="Departmental Tallies"
      badge={`${sorted.length} depts`}
      accent="bg-indigo-500"
      footer={
        <div className="flex items-center justify-between">
          {/* Top 3 mini badges */}
          <div className="flex items-center gap-3">
            {sorted.slice(0, 3).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="text-xs">{MEDAL_ICONS[i]}</span>
                <div className="flex items-center gap-1">
                  {LOGO_MAP[d.name?.toUpperCase()] ? (
                    <img
                      src={LOGO_MAP[d.name?.toUpperCase()]}
                      alt={d.name}
                      className="w-4 h-4 object-contain"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-sm bg-zinc-200 flex items-center justify-center">
                      <span className="text-[7px] font-black text-zinc-500">
                        {d.name.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-zinc-600">{d.name}</span>
                </div>
              </div>
            ))}
          </div>

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all <ArrowUpRight size={10} />
            </button>
          )}
        </div>
      }
    >
      {/* ── Leaderboard list ── */}
      <div className="h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {visible.map((dept, i) => {
          const logo = LOGO_MAP[dept.name?.toUpperCase()];
          const fillPct = Math.round((dept.total / maxVal) * 100);
          const barColor = BAR_COLORS[i % BAR_COLORS.length];
          const isTop = i < 3;

          return (
            <button
              key={dept.name}
              onClick={() => onBarClick?.(dept.name)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg
                hover:bg-zinc-50 transition-colors group text-left
                ${isTop ? 'bg-zinc-50/60' : ''}`}
            >
              {/* Rank */}
              <span className={`w-5 text-center flex-shrink-0 text-[11px] font-black ${i === 0 ? 'text-amber-500'
                  : i === 1 ? 'text-zinc-400'
                    : i === 2 ? 'text-orange-700'
                      : 'text-zinc-300'
                }`}>
                {i < 3 ? MEDAL_ICONS[i] : `${i + 1}`}
              </span>

              {/* Logo / Initial */}
              <div className="w-7 h-7 rounded-md border border-zinc-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logo ? (
                  <img src={logo} alt={dept.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[8px] font-black text-zinc-400">
                    {dept.name.slice(0, 3)}
                  </span>
                )}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 truncate leading-none">
                    {dept.name}
                  </span>
                  <span className="text-[11px] font-black text-zinc-900 tabular-nums ml-2 flex-shrink-0">
                    {dept.total.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${fillPct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <span className="text-[10px] font-bold text-zinc-400 flex-shrink-0 w-8 text-right">
                {dept.percentage}%
              </span>
            </button>
          );
        })}

        {sorted.length > 8 && (
          <div className="text-center py-1">
            <span className="text-[10px] text-zinc-400 font-medium">
              +{sorted.length - 8} more
            </span>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};