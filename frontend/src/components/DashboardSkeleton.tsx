import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const MetricSkeleton = () => (
    <Card className="relative overflow-hidden bg-card border-border">
        <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 w-full">
                    <div className="h-2 w-20 bg-muted-foreground/10 animate-pulse rounded" />
                    <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="p-2 w-8 h-8 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-10 w-full mt-2 bg-muted/50 animate-pulse rounded" />
            <div className="mt-4 h-3 w-16 bg-muted animate-pulse rounded" />
        </CardContent>
    </Card>
);

export const ChartSkeleton = () => (
    <Card className="h-full border-border overflow-hidden bg-card">
        <CardHeader className="p-4 pb-0">
            <div className="h-4 w-32 bg-muted-foreground/10 animate-pulse rounded mb-2" />
            <div className="h-2 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-4 h-[250px]">
            <div className="w-full h-full bg-muted/50 animate-pulse rounded-xl" />
        </CardContent>
    </Card>
);

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
            </div>

            <div className="flex items-center gap-4 mb-5">
                <div className="h-2 w-32 bg-muted-foreground/10 animate-pulse rounded" />
                <div className="flex-1 h-px bg-border" />
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
