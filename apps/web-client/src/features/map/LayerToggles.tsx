import { useUIStore } from '@/store/uiStore';
import { Thermometer, Droplets, Zap, TrafficCone } from 'lucide-react';
import clsx from 'clsx';

const LAYER_CONFIG = [
    { id: 'heat', label: 'Extreme Heat', icon: Thermometer, color: 'text-red-500' },
    { id: 'flood', label: 'Flood Risk', icon: Droplets, color: 'text-blue-500' },
    { id: 'power', label: 'Power Grid', icon: Zap, color: 'text-yellow-500' },
    { id: 'traffic', label: 'Traffic', icon: TrafficCone, color: 'text-amber-500' },
];

export function LayerToggles() {
    const { activeLayerIds, toggleLayer } = useUIStore();

    return (
        <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-1">
                <div className="flex flex-col gap-1">
                    {LAYER_CONFIG.map((layer) => {
                        const isActive = activeLayerIds.includes(layer.id);
                        const Icon = layer.icon;
                        return (
                            <button
                                key={layer.id}
                                onClick={() => toggleLayer(layer.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-40",
                                    isActive
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                                aria-pressed={isActive}
                                aria-label={`Toggle ${layer.label}`}
                            >
                                <Icon size={16} className={clsx(isActive ? layer.color : "text-slate-400")} />
                                <span>{layer.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
