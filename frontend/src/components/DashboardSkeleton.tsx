import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const MetricSkeleton = () => (
    <Card className="relative overflow-hidden bg-white border-slate-100">
        <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 w-full">
                    <div className="h-2 w-20 bg-slate-100 animate-pulse rounded" />
                    <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
                </div>
                <div className="p-2 w-8 h-8 rounded-xl bg-slate-50 animate-pulse" />
            </div>
            <div className="h-10 w-full mt-2 bg-slate-50/50 animate-pulse rounded" />
            <div className="mt-4 h-3 w-16 bg-slate-50 animate-pulse rounded" />
        </CardContent>
    </Card>
);

export const ChartSkeleton = () => (
    <Card className="h-full border-slate-100 overflow-hidden">
        <CardHeader className="p-4 pb-0">
            <div className="h-4 w-32 bg-slate-100 animate-pulse rounded mb-2" />
            <div className="h-2 w-48 bg-slate-50 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-4 h-[250px]">
            <div className="w-full h-full bg-slate-50/50 animate-pulse rounded-xl" />
        </CardContent>
    </Card>
);

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
            </div>

            <div className="flex items-center gap-4 mb-5">
                <div className="h-2 w-32 bg-slate-200 animate-pulse rounded" />
                <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 h-[340px]">
                    <ChartSkeleton />
                </div>
                <div className="lg:col-span-5 h-[340px]">
                    <ChartSkeleton />
                </div>
                <div className="lg:col-span-2 h-[340px]">
                    <ChartSkeleton />
                </div>
            </div>
        </div>
    );
};
