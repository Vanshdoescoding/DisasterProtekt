import { Film, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useClipOrchestration } from './clipOrchestration';

export interface SelectedStreet {
    id: string;
    coordinate: [number, number];
}

interface StreetConsequenceProps {
    selectedStreet: SelectedStreet | null;
    branchId: string;
    simTick: number;
    placementId: string | null;
    onClose: () => void;
    className?: string;
}

export function StreetConsequencePanel({
    selectedStreet,
    branchId,
    simTick,
    placementId,
    onClose,
    className
}: StreetConsequenceProps) {
    const clipState = useClipOrchestration({
        selectedStreetId: selectedStreet?.id ?? null,
        branchId,
        simTick,
        placementId
    });

    if (!selectedStreet) return null;

    return (
        <div className={clsx(
            "h-full w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl flex flex-col overflow-hidden",
            className
        )}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm">STREET CONSEQUENCE</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedStreet.id}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close consequence panel">
                    x
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">HEAT RISK</div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-500">Critical</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">GRID STRAIN</div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">High</div>
                    </div>
                </div>

                <div className="border rounded-lg border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Film size={14} className="text-blue-500" />
                            <span className="text-xs font-bold uppercase">Consequence Simulation</span>
                        </div>
                        {clipState.status === 'analyzing' && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded animate-pulse">ANALYZING...</span>
                        )}
                        {clipState.status === 'ready' && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle size={10} /> LIVE
                            </span>
                        )}
                        {clipState.status === 'error' && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">ERROR</span>
                        )}
                    </div>

                    <div className="aspect-video bg-black relative flex items-center justify-center">
                        {clipState.status === 'loading' || clipState.status === 'analyzing' ? (
                            <div className="text-center">
                                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-xs text-slate-400">
                                    {clipState.status === 'loading' ? 'Locating footage...' : 'Synthesizing hazards...'}
                                </p>
                            </div>
                        ) : clipState.status === 'ready' ? (
                            <img src={clipState.clips[0]?.url} className="w-full h-full object-cover opacity-80" alt="Simulated clip preview" />
                        ) : clipState.status === 'error' ? (
                            <div className="text-center px-6">
                                <p className="text-xs text-red-300">Clip unavailable. Select another street or adjust timeline.</p>
                            </div>
                        ) : (
                            <span className="text-slate-600 text-xs">No Signal</span>
                        )}

                        {clipState.status === 'ready' && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-slate-300">
                                        <div>CONFIDENCE: <span className="text-emerald-400 font-bold">{(clipState.clips[0].confidence * 100).toFixed(0)}%</span></div>
                                        <div>SRC: {clipState.clips[0].relatedRunId}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {format(new Date(), 'HH:mm:ss')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Projected Cascade (Next 60m)</h4>
                    <ul className="text-sm space-y-2">
                        <li className="flex gap-2">
                            <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-mono text-xs text-slate-500 mr-2">+10m</span>
                                Substation load exceeds safety threshold.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-mono text-xs text-slate-500 mr-2">+25m</span>
                                Traffic signals at 7th/Main default to flash.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
