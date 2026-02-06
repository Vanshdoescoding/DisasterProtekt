import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Activity, AlertOctagon, Check, Server, Zap } from 'lucide-react';
import clsx from 'clsx';
import * as Tooltip from '@radix-ui/react-tooltip';

export function HealthStatus() {
    // Poll health endpoints
    const pipeline = useQuery({ queryKey: ['health', 'pipeline'], queryFn: apiClient.getHealthPipeline, refetchInterval: 10000 });
    const sim = useQuery({ queryKey: ['health', 'simulation'], queryFn: apiClient.getHealthSimulation, refetchInterval: 10000 });
    const gemini = useQuery({ queryKey: ['health', 'gemini'], queryFn: apiClient.getHealthGemini, refetchInterval: 15000 });
    const streams = useQuery({ queryKey: ['health', 'streams'], queryFn: apiClient.getHealthStaleStreams, refetchInterval: 10000 });

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
            {/* Stale Streams Warning */}
            {streams.data?.warnings?.length ? (
                <div className="bg-amber-500/90 text-white backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-amber-400 flex items-center gap-3 animate-pulse">
                    <AlertOctagon size={18} />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase">Critical Stream Stale</span>
                        <span className="text-[10px] opacity-90">{streams.data.warnings[0]}</span>
                    </div>
                </div>
            ) : null}

            {/* Status Bar */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-full shadow-lg p-1.5 flex items-center gap-1">
                <StatusItem label="PIPELINE" status={pipeline.data?.status} icon={Server} isLoading={pipeline.isLoading} />
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1" />
                <StatusItem label="SIM" status={sim.data?.status} icon={Activity} isLoading={sim.isLoading} />
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1" />
                <StatusItem label="GEMINI" status={gemini.data?.status} icon={Zap} isLoading={gemini.isLoading} />
            </div>
        </div>
    );
}

function StatusItem({ label, status, icon: Icon, isLoading }: { label: string, status?: string, icon: any, isLoading: boolean }) {
    const isOk = status === 'ok';
    const isDegraded = status === 'degraded';
    const isDown = status === 'down';

    return (
        <Tooltip.Provider>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold transition-colors cursor-help",
                        isLoading && "opacity-50",
                        isOk && "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10",
                        isDegraded && "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10",
                        isDown && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10",
                        !status && !isLoading && "text-slate-400 bg-slate-100 dark:bg-slate-800"
                    )}>
                        <Icon size={12} />
                        <span>{label}</span>
                        {isOk && <Check size={10} />}
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content className="z-[60] bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-md" sideOffset={5}>
                        {status ? status.toUpperCase() : 'UNKNOWN'}
                        <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
