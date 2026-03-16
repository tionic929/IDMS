import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ArrowRight, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LogEntry } from '../logsData';

interface ActivityLogsProps {
    logs: LogEntry[];
    onViewDetails: (log: LogEntry) => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, onViewDetails }) => {
    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <motion.div
                            key={log.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-lg bg-card overflow-hidden group border-l-4 border-l-transparent hover:border-l-primary">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-6 gap-6">
                                        <div className={cn(
                                            "w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                            log.status === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                            log.status === 'warning' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                            log.status === 'info' && "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        )}>
                                            {log.type === 'submission' && <FileText size={20} />}
                                            {log.type === 'report' && <Download size={20} />}
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.user}</span>
                                                    <span className="w-1 h-1 rounded-full bg-muted" />
                                                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 bg-muted text-muted-foreground border-none">
                                                        {log.type}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{log.date}</span>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground line-clamp-1">{log.action}</p>
                                        </div>

                                        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                onClick={() => onViewDetails(log)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                View Details
                                                <ArrowRight size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-64 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 rounded-lg border border-dashed border-border"
                    >
                        <div className="p-4 bg-muted/20 rounded-full">
                            <Search size={32} className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">No activities found</p>
                            <p className="text-xs text-muted-foreground">Adjust your filters or search query and try again.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActivityLogs;
