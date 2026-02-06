import { useBranchStore } from '@/store/branchStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ArrowRight, GitCompare, Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

export function DiffView() {
    const { activeBranchId, runId } = useBranchStore();

    // Only show diff if we are NOT on baseline
    const isBaseline = activeBranchId === 'baseline';

    const { data: diff, isLoading } = useQuery({
        queryKey: ['branch', 'diff', runId, 'baseline', activeBranchId],
        queryFn: () => runId ? apiClient.getBranchDiff(runId!, 'baseline', activeBranchId) : null,
        enabled: !!runId && !isBaseline,
    });

    if (isBaseline || !runId) return null;

    return (
        <div className="absolute top-4 right-4 z-10 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <GitCompare size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    Branch Diff
                </span>
            </div>

            <div className="p-3">
                {isLoading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                    </div>
                ) : diff ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Baseline Events</span>
                            <span className="font-mono">{diff.baseline_event_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Branch Events</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {diff.compare_event_count}
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs font-mono">
                                    <Plus size={10} />
                                    {diff.delta_event_count}
                                </div>
                                <div className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs font-mono">
                                    <Minus size={10} />
                                    0
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 text-center py-2">
                        No diff data available.
                    </div>
                )}
            </div>
        </div>
    );
}
