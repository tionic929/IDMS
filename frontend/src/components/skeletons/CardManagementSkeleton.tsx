import React from 'react';

const CardManagementSkeleton: React.FC = () => {
  return (
    <div className="h-full bg-zinc-50 dark:bg-[#020617] flex flex-col overflow-hidden animate-pulse">
      <main className="flex-1 flex overflow-hidden">

        {/* ASIDE SKELETON (Preview Panel) */}
        <aside className="w-[660px] bg-white dark:bg-zinc-950 flex flex-col border-r border-slate-200 dark:border-zinc-900 shadow-2xl shrink-0">
          {/* Card Preview Area */}
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-200 dark:border-zinc-900">
            <div className="flex flex-row gap-4 items-center justify-center">
              {/* Front Card */}
              <div className="w-[180px] h-[110px] bg-slate-200 dark:bg-zinc-800 rounded-lg shadow-sm"></div>
              {/* Back Card */}
              <div className="w-[180px] h-[110px] bg-slate-200 dark:bg-zinc-800 rounded-lg shadow-sm"></div>
            </div>
          </div>

          <div className="flex-1 px-6 py-8 space-y-8">
            {/* Header / Name Skeleton */}
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
              <div className="h-6 w-1/2 bg-slate-100 dark:bg-zinc-900 rounded-md"></div>
            </div>

            {/* Information Groups */}
            <div className="space-y-6 border border-slate-100 dark:border-zinc-900 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
                <div className="h-2 w-24 bg-slate-100 dark:bg-zinc-900 rounded"></div>
                <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 h-16"></div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 h-16"></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 h-20"></div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-zinc-900 grid grid-cols-2 gap-3">
            <div className="h-12 bg-slate-100 dark:bg-zinc-900 rounded-xl"></div>
            <div className="h-12 bg-teal-200 dark:bg-teal-900/30 rounded-xl"></div>
          </div>
        </aside>

        {/* SECTION SKELETON (Data Grid) */}
        <section className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#020617]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-4">
            <div className="h-10 w-full max-w-md bg-slate-100 dark:bg-zinc-900 rounded-lg"></div>
            <div className="h-10 w-10 bg-slate-100 dark:bg-zinc-900 rounded-lg"></div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-hidden">
            <div className="w-full">
              {/* Header Row */}
              <div className="flex px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900">
                <div className="w-12 h-4 bg-slate-200 dark:bg-zinc-800 rounded mr-4"></div>
                <div className="flex-1 h-4 bg-slate-200 dark:bg-zinc-800 rounded mr-4"></div>
                <div className="w-32 h-4 bg-slate-200 dark:bg-zinc-800 rounded mr-4"></div>
                <div className="w-24 h-4 bg-slate-200 dark:bg-zinc-800 rounded mr-4"></div>
                <div className="w-24 h-4 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              </div>

              {/* Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex px-6 py-8 border-b border-slate-50 dark:border-zinc-900 items-center">
                  <div className="w-5 h-5 bg-slate-100 dark:bg-zinc-900 rounded mr-8"></div>
                  <div className="flex-1 space-y-2 mr-4">
                    <div className="h-3 w-48 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-2 w-32 bg-slate-100 dark:bg-zinc-900 rounded"></div>
                  </div>
                  <div className="w-32 h-3 bg-slate-100 dark:bg-zinc-900 rounded mr-4"></div>
                  <div className="w-24 h-5 bg-slate-100 dark:bg-zinc-900 rounded-full mr-4"></div>
                  <div className="w-24 h-3 bg-slate-100 dark:bg-zinc-900 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CardManagementSkeleton;