import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { CheckSquare, Square, RefreshCw, Database, Trash2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Students } from '@/types/students';

export const PendingRow = React.memo(({
    student, isActive, isSelected, onSelect, onView, courses,
}: {
    student: Students; isActive: boolean; isSelected: boolean;
    onSelect: (id: number) => void; onView: (id: number) => void; courses: Record<string, any>;
}) => (
    <TableRow
        onClick={() => onView(student.id)}
        className={cn(
            'group cursor-pointer transition-colors select-none',
            isActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent/40'
        )}
    >
        <TableCell className="pl-3 w-8 py-2" onClick={e => { e.stopPropagation(); onSelect(student.id); }}>
            {isSelected
                ? <CheckSquare size={13} className="text-primary" />
                : <Square size={13} className="opacity-20 group-hover:opacity-50 transition-opacity" />}
        </TableCell>
        <TableCell className="py-3 px-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col min-w-0">
                    <span className="text-[7px] text-muted-foreground/60 font-bold uppercase leading-tight tracking-widest mb-0.5">Full Name</span>
                    <p className="text-[11px] font-black uppercase leading-tight text-primary truncate">
                        {student.manual_full_name || `${student.first_name} ${student.middle_initial ? `${student.middle_initial} ` : ''}${student.last_name}`}
                    </p>
                </div>
            </div>
        </TableCell>
        <TableCell className="py-3 px-2 font-mono text-[10px] font-bold text-muted-foreground/80 truncate text-center">{student.id_number}</TableCell>
        <TableCell className="py-3 px-2">
            <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full border whitespace-nowrap block truncate text-center transition-all',
                courses[student.course]?.border || 'border-zinc-200',
                courses[student.course]?.color || 'text-zinc-500'
            )}>{student.course}</span>
        </TableCell>
        <TableCell className="py-3 px-3 text-center">
            <span className="text-amber-500 text-[9px] font-black uppercase flex items-center gap-1.5 justify-center">
                <RefreshCw size={10} className="animate-spin shrink-0 opacity-80" />
            </span>
        </TableCell>
    </TableRow>
));

export const ConfirmedRow = React.memo(({
    student, isActive, onView, onPrint, onArchive, onDelete, courses,
}: {
    student: Students; isActive: boolean;
    onView: (id: number) => void; onPrint: (s: Students) => void;
    onArchive: (id: number) => void; onDelete: (id: number) => void; courses: Record<string, any>;
}) => (
    <TableRow
        onClick={() => onView(student.id)}
        className={cn(
            'group cursor-pointer transition-colors select-none',
            isActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent/40'
        )}
    >
        <TableCell className="pl-4 py-3 px-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col min-w-0">
                    <span className="text-[8px] text-primary/70 font-bold uppercase leading-tight tracking-wider truncate">Full Name</span>
                    <p className="text-[11px] font-black uppercase leading-tight text-primary truncate">
                        {student.manual_full_name || `${student.first_name} ${student.middle_initial ? `${student.middle_initial} ` : ''}${student.last_name}`}
                    </p>
                </div>
            </div>
        </TableCell>
        <TableCell className="py-3 px-2 font-mono text-[11px] font-bold text-muted-foreground truncate">{student.id_number}</TableCell>
        <TableCell className="py-3 px-2">
            <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded border whitespace-nowrap block truncate text-center',
                courses[student.course]?.border || 'border-zinc-200',
                courses[student.course]?.color || 'text-zinc-500'
            )}>{student.course}</span>
        </TableCell>
        <TableCell className="py-3 px-3">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={e => { e.stopPropagation(); onArchive(student.id); }}
                    className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 border border-transparent hover:border-rose-500/20"
                    title="Archive"><Database size={12} /></button>
                <button onClick={e => { e.stopPropagation(); onDelete(student.id); }}
                    className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 border border-transparent hover:border-rose-500/20"
                    title="Delete"><Trash2 size={12} /></button>
                <button onClick={e => { e.stopPropagation(); onPrint(student); }}
                    className="h-6 px-3 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/80 text-white font-black text-[9px] uppercase transition-all shadow-sm shadow-primary/20 shrink-0"
                    title="Print"><Printer size={11} /></button>
            </div>
        </TableCell>
    </TableRow>
));
