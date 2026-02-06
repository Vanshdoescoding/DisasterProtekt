import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Info, Loader2, X } from 'lucide-react';
import { useBranchStore } from '@/store/branchStore';
import * as Popover from '@radix-ui/react-popover';

interface WhyCardProps {
    metricKey: string;
    label: string;
    value: string | number;
}

export function WhyCard({ metricKey, label, value }: WhyCardProps) {
    const { runId } = useBranchStore();
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['audit', 'why', runId, metricKey],
        queryFn: () => runId ? apiClient.getAuditMetricWhy(runId, metricKey) : null,
        enabled: isOpen && !!runId,
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <button
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                    aria-label={`Show details for ${label}`}
                >
                    <div className="flex-1">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{label}</div>
                        <div className="text-sm font-mono font-medium">{value}</div>
                    </div>
                    <Info size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    className="z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={5}
                >
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Audit Trace</h4>
                        <Popover.Close className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={14} />
                        </Popover.Close>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-slate-400">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-xs py-2">
                            Unable to load audit trace.
                        </div>
                    ) : data ? (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                Metric: <span className="font-mono text-indigo-600 dark:text-indigo-400">{data.metric_key}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded text-xs text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                                "{data.note}"
                            </div>

                            {data.decision_events.length > 0 && (
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Contributing Decisions</div>
                                    <ul className="space-y-1">
                                        {data.decision_events.map(evtId => (
                                            <li key={evtId} className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate">
                                                {evtId}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                    <Popover.Arrow className="fill-white dark:fill-slate-900" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
