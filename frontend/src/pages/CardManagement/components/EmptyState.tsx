import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Database } from 'lucide-react';

export const EmptyState = ({ label, icon: Icon = Database, colSpan = 5 }: {
    label: string; icon?: React.ElementType; colSpan?: number;
}) => (
    <TableRow className="hover:bg-transparent">
        <TableCell colSpan={colSpan} className="py-10 text-center">
            <div className="flex flex-col items-center gap-2 opacity-20">
                <Icon size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
        </TableCell>
    </TableRow>
);
