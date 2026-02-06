import { ShieldCheck, FileText, Database, Lock } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface EvidenceItem {
    id: string;
    label: string;
    value: string;
    confidence: 'low' | 'expected' | 'high';
    source: string;
    freshness: Date;
    restricted?: boolean;
}

export function EvidencePanel() {
    // Mock Evidence Stream
    const evidence: EvidenceItem[] = [
        {
            id: 'ev_1',
            label: 'Grid Load Projection',
            value: '4,520 MW',
            confidence: 'expected',
            source: 'Model: GridFlow v2.1 (Run #882)',
            freshness: new Date()
        },
        {
            id: 'ev_2',
            label: 'Casualty Est. (Unmitigated)',
            value: '12 - 45',
            confidence: 'low',
            source: 'Model: CasSim v4.0',
            freshness: new Date()
        },
        {
            id: 'ev_3',
            label: 'Critical Infra Status',
            value: 'SENSITIVE',
            confidence: 'high',
            source: 'DHS Feed',
            freshness: new Date(),
            restricted: true
        }
    ];

    return (
        <div className="absolute bottom-6 right-4 z-10 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Decision Evidence</span>
                </div>
                <span className="text-[10px] text-slate-400">AUDIT LOG ACTIVE</span>
            </div>

            <div className="p-3 space-y-3">
                {evidence.map(item => (
                    <div key={item.id} className="text-sm">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-slate-500 text-xs font-medium">{item.label}</span>
                            <span className={clsx(
                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                item.confidence === 'high' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    item.confidence === 'low' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>{item.confidence} Conf.</span>
                        </div>

                        <div className="font-mono font-medium flex items-center gap-2">
                            {item.restricted ? (
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Lock size={12} /> RESTRICTED DATA
                                </span>
                            ) : (
                                <span>{item.value}</span>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1">
                                <Database size={10} />
                                <span className="truncate max-w-[120px]">{item.source}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FileText size={10} />
                                <span>{format(item.freshness, 'HH:mm')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
