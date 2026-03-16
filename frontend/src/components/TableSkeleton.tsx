import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) => (
    <div className="w-full space-y-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm shadow-primary/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            {[...Array(cols)].map((_, i) => (
                                <th key={i} className="px-6 py-4">
                                    <div className="h-2 w-16 bg-muted-foreground/10 animate-pulse rounded" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {[...Array(rows)].map((_, i) => (
                            <tr key={i}>
                                {[...Array(cols)].map((_, j) => (
                                    <td key={j} className="px-6 py-4">
                                        <div className={`h-4 ${j === 0 ? 'w-32' : 'w-24'} bg-muted animate-pulse rounded`} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export const ApplicantSkeleton = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-28 overflow-hidden bg-card border-border shadow-sm shadow-primary/5">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-2 w-20 bg-muted-foreground/10 animate-pulse rounded" />
                            <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                        </div>
                        <div className="p-3 w-12 h-12 rounded-lg bg-muted animate-pulse border border-border" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="space-y-4">
            <div className="h-3 w-32 bg-muted-foreground/10 animate-pulse rounded" />
            <TableSkeleton rows={8} cols={4} />
        </div>
    </div>
);
