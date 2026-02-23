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
  title?: string;
  data: Department[];
  onViewDetails?: () => void;
  onBarClick?: (deptName: string) => void;
}> = ({ title = "Section Ranks", data, onViewDetails, onBarClick }) => {

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-2 py-12">
          <BarChart3 size={28} className="opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-wider">No Data</p>
        </div>
      </ChartContainer>
    );
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const maxVal = sorted[0]?.total || 1;
  const visible = sorted.slice(0, 8);

  return (
    <ChartContainer
      title={title}
      badge={`${sorted.length} Groups`}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High Traffic Areas</span>
          </div>

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-[10px] font-bold text-primary hover:text-primary/70 transition-all uppercase tracking-widest"
            >
              View list ↗
            </button>
          )}
        </div>
      }
    >
      <div className="h-[210px] overflow-y-auto space-y-1 pr-1 scrollbar-none">
        {visible.map((dept, i) => {
          const logo = LOGO_MAP[dept.name?.toUpperCase()];
          const fillPct = Math.round((dept.total / maxVal) * 100);

          return (
            <button
              key={dept.name}
              onClick={() => onBarClick?.(dept.name)}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all group text-left relative overflow-hidden"
            >
              <span className={`w-4 text-center flex-shrink-0 text-[10px] font-bold tabular-nums ${i < 3 ? 'text-primary' : 'text-slate-300'}`}>
                {i + 1}
              </span>

              <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden transition-transform group-hover:scale-110">
                {logo ? (
                  <img src={logo} alt={dept.name} className="w-full h-full object-contain opacity-80 group-hover:opacity-100" />
                ) : (
                  <span className="text-[8px] font-bold text-slate-400">
                    {dept.name.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-slate-600 truncate uppercase tracking-tight group-hover:text-slate-900 transition-colors">
                    {dept.name}
                  </span>
                  <span className="text-[10px] font-black text-slate-900 tabular-nums ml-2 flex-shrink-0">
                    {dept.total.toLocaleString()}
                  </span>
                </div>
                <div className="h-[2px] w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${fillPct}%`, backgroundColor: '#00928a' }}
                  />
                </div>
              </div>
            </button>
          );
        })}

        {sorted.length > 8 && (
          <div className="text-center py-2">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              +{sorted.length - 8} Additional Entries
            </span>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
