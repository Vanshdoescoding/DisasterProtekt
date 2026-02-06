import * as Switch from '@radix-ui/react-switch';
import { Activity } from 'lucide-react';

export function UncertaintyToggle() {
    return (
        <div className="absolute top-4 right-16 z-10">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 flex items-center gap-3">
                <Activity size={16} className="text-slate-400 ml-1" />
                <span className="text-xs font-medium text-slate-500">Show Uncertainty Bands</span>
                <Switch.Root className="w-[36px] h-[20px] bg-slate-200 dark:bg-slate-700 rounded-full relative shadow-inner focus:outline-none cursor-default data-[state=checked]:bg-blue-600 outline-none cursor-pointer">
                    <Switch.Thumb className="block w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
                </Switch.Root>
            </div>
        </div>
    );
}
