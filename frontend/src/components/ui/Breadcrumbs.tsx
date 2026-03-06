import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <nav className="flex items-center gap-1.5 mb-2">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                        )}
                        {item.href && !isLast ? (
                            <Link
                                to={item.href}
                                className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLast ? 'text-slate-600' : 'text-slate-400'
                                    }`}
                            >
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
