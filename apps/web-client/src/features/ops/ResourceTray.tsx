import { Truck, Zap, Droplets, Tent, ShieldAlert, Siren, Plane, Shield } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { OpPlacementDTO } from '@/services/api/types';

// Resource Types Definition
type ResourceType = OpPlacementDTO['type'];

const RESOURCES: Array<{ id: ResourceType; label: string; icon: typeof Plane; color: string }> = [
    { id: 'helicopter', label: 'Medevac Heli', icon: Plane, color: 'text-sky-500' },
    { id: 'ambulance', label: 'Amb. Staging', icon: Siren, color: 'text-red-500' },
    { id: 'fire', label: 'Fire Crew', icon: Truck, color: 'text-orange-500' },
    { id: 'pump', label: 'Water Pump', icon: Droplets, color: 'text-blue-500' },
    { id: 'generator', label: 'Mobile Gen', icon: Zap, color: 'text-yellow-500' },
    { id: 'shelter', label: 'Cooling Center', icon: Tent, color: 'text-emerald-500' },
    { id: 'barrier', label: 'Road Barrier', icon: ShieldAlert, color: 'text-slate-500' },
    { id: 'police', label: 'Traffic Control', icon: Shield, color: 'text-indigo-400' },
];

export function ResourceTray() {
    const { mode } = useUIStore();

    const handleDragStart = (e: React.DragEvent, resourceId: ResourceType) => {
        e.dataTransfer.setData('resource/id', resourceId);
        e.dataTransfer.effectAllowed = 'copy';
        // Add a "ghost" image or effect here if needed
    };

    if (mode !== 'ops') return null;

    return (
        <div className="absolute top-20 left-4 z-10 w-40 flex flex-col gap-2">
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-100 p-2 rounded-t-lg">
                <span className="text-xs font-bold uppercase tracking-wider">Assets</span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-b-lg p-2 flex flex-col gap-2">
                {RESOURCES.map((res) => {
                    const Icon = res.icon;
                    return (
                        <div
                            key={res.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, res.id)}
                            className="flex items-center gap-3 p-2 rounded bg-slate-800 hover:bg-slate-700 cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-500 transition-colors"
                        >
                            <Icon size={16} className={res.color} />
                            <span className="text-xs font-medium text-slate-200">{res.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
