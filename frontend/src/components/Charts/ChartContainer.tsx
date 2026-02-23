import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContainerProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accent?: string;
  className?: string;
}

export const ChartContainer: React.FC<ContainerProps> = ({
  title,
  badge,
  children,
  footer,
  accent,
  className,
}) => (
  <Card className={cn("flex flex-col h-full min-h-[280px] overflow-hidden transition-all duration-300 bg-white border-slate-200 group relative shadow-sm hover:shadow-md", className)}>
    <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-0 space-y-0 relative z-10">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">
            {title}
          </CardTitle>
          <div className="h-[2px] w-4 bg-primary rounded-full" />
        </div>
        {badge && (
          <span className="text-[9px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-slate-100">
            {badge}
          </span>
        )}
      </div>
    </CardHeader>

    <CardContent className="flex-1 w-full px-4 pt-4 pb-2 relative z-10">
      {children}
    </CardContent>

    {footer && (
      <div className="px-5 pb-4 pt-2 mt-auto border-t border-slate-100 relative z-10">
        {footer}
      </div>
    )}
  </Card>
);