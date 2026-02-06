import { useMemo } from 'react';
import { useBranchStore } from '@/store/branchStore';
import { GitBranch, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function BranchTimeline() {
    const { activeBranchId, branches, events, setActiveBranch } = useBranchStore();

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

            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 text-xs">
                <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Branch Compare</div>
                <div className="flex flex-col gap-1">
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
            </div>
        </div>
    );
}
