import { useMemo } from 'react';
import { useBranchStore } from '@/store/branchStore';
import { GitBranch, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function BranchTimeline() {
    const { activeBranchId, branches, events, setActiveBranch, runId } = useBranchStore();

    const branchList = useMemo(() => Object.values(branches), [branches]);
    const activeBranch = branches[activeBranchId];
    const lastEvent = events[activeBranchId]?.[events[activeBranchId].length - 1];
    const lastActionTime = lastEvent ? format(new Date(lastEvent.timestamp), 'HH:mm') : '—';

    return (
        <div className="absolute top-4 left-48 z-10 flex flex-col gap-2">
            <div className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur border text-xs font-mono transition-all",
                activeBranchId === 'baseline'
                    ? "bg-slate-900/90 text-white border-slate-700 shadow-lg ring-1 ring-white/20"
                    : "bg-slate-100/50 text-slate-500 border-slate-200"
            )}>
                <GitBranch size={12} />
                <span>BASELINE</span>
            </div>

            {activeBranchId !== 'baseline' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur border text-xs font-mono bg-indigo-600/90 text-white border-indigo-400 shadow-lg animate-in slide-in-from-top-2">
                    <GitBranch size={12} />
                    <span>{activeBranch.name}</span>
                    <span className="opacity-50 mx-1">|</span>
                    <GitCommit size={12} />
                    <span>Last Action: {lastActionTime}</span>
                </div>
            )}

            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 text-xs w-64 max-h-[80vh] flex flex-col">
                <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Branch Compare</div>
                <div className="flex flex-col gap-1 mb-4 shrink-0">
                    {branchList.map((branch) => (
                        <button
                            key={branch.id}
                            onClick={() => setActiveBranch(branch.id)}
                            className={clsx(
                                "flex items-center justify-between px-2 py-1 rounded-md transition-colors",
                                branch.id === activeBranchId
                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            )}
                            aria-pressed={branch.id === activeBranchId}
                            aria-label={`Select ${branch.name}`}
                        >
                            <span className="truncate">{branch.name}</span>
                            {branch.isBaseline && <span className="text-[10px] uppercase text-slate-400">Baseline</span>}
                        </button>
                    ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex-1 overflow-hidden flex flex-col">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2 shrink-0">Audit Log</div>
                    <div className="overflow-y-auto min-h-0 flex-1 pr-1 space-y-2">
                        {runId ? (
                            <TimelineEvents runId={runId} branchId={activeBranchId} />
                        ) : (
                            <div className="text-slate-400 italic">No run active</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TimelineEvents({ runId, branchId }: { runId: string, branchId: string }) {
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['audit', 'timeline', runId, branchId],
        queryFn: () => apiClient.getAuditTimeline(runId, branchId),
        refetchInterval: 5000
    });

    if (isLoading) return <div className="animate-pulse space-y-2">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
    </div>;

    if (error) return <div className="text-red-500">Failed to load events</div>;

    if (!events?.entries || events.entries.length === 0) {
        return <div className="text-slate-400 italic">No events recorded</div>;
    }

    return (
        <div className="space-y-3">
            {events.entries.map((entry, idx) => (
                <div key={idx} className="relative pl-3 border-l border-slate-200 dark:border-slate-800">
                    <div className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2" title={entry.category}>
                                {entry.category}
                            </span>
                            <span className="text-[10px] text-slate-400 tabular-nums">
                                {format(new Date(entry.occurred_at), 'HH:mm:ss')}
                            </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 leading-tight">
                            {entry.summary}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
