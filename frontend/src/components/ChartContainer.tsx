import React from 'react';

interface ContainerProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ChartContainer: React.FC<ContainerProps> = ({ title, children, footer }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full min-h-[300px]">
    {/* Title Section */}
    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">
      {title}
    </h3>

    {/* Content Section */}
    <div className="flex-1 w-full">
      {children}
    </div>

    {/* Footer Section */}
    {footer && (
      <div className="mt-6 pt-4 border-t border-slate-100">
        {typeof footer === 'object' && React.isValidElement(footer) ? (
          footer
        ) : (
          <div className="flex justify-between items-center text-xs">
            {footer}
          </div>
        )}
      </div>
    )}
  </div>
);