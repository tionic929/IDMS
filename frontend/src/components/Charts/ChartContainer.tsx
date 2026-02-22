import React from 'react';

interface ContainerProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accent?: string; // tailwind border-color class e.g. 'border-indigo-500'
}

export const ChartContainer: React.FC<ContainerProps> = ({
  title,
  badge,
  children,
  footer,
  accent,
}) => (
  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full min-h-[300px] overflow-hidden">
    {/* Accent top bar */}
    {accent && <div className={`h-0.5 w-full ${accent}`} />}

    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          {title}
        </h3>
        {badge && (
          <span className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full uppercase tracking-wide border border-zinc-200">
            {badge}
          </span>
        )}
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 w-full px-5 pt-4">
      {children}
    </div>

    {/* Footer */}
    {footer && (
      <div className="px-5 pb-4 pt-3 mt-auto border-t border-zinc-100">
        {footer}
      </div>
    )}
  </div>
);