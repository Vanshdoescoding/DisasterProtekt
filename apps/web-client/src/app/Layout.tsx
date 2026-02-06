import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import clsx from 'clsx';
import { LayoutDashboard, Map as MapIcon, History, FileText, Settings, AlertTriangle, PanelsTopLeft } from 'lucide-react';
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ size?: number | string; className?: string }>;

function SidebarItem({ icon: Icon, label, active }: { icon: IconComponent; label: string; active?: boolean }) {
    return (
        <div className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
            active ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
        )}>
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

export function AppLayout() {
    const { mode, sidebarOpen, setMode, toggleSidebar } = useUIStore();
    const isOps = mode === 'ops';

    return (
        <div className={clsx(
            "min-h-screen flex flex-col transition-colors",
            isOps ? "dark bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
        )}>
            {/* Header */}
            <header className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <span className="font-bold tracking-tight">DisasterProtekt</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700 ml-2">
                        PHOENIX V1
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle sidebar"
                    >
                        <PanelsTopLeft size={14} />
                    </button>
                    <button
                        onClick={() => setMode(isOps ? 'briefing' : 'ops')}
                        className={clsx(
                            "text-xs px-3 py-1 rounded-full border transition-colors",
                            isOps
                                ? "bg-slate-900 text-white border-slate-700"
                                : "bg-white text-slate-700 border-slate-200"
                        )}
                        aria-label="Toggle ops or briefing mode"
                    >
                        {isOps ? 'Ops Mode' : 'Briefing Mode'}
                    </button>
                    <div className="text-xs font-mono text-slate-400 hidden sm:block">
                        ACTIVE: {mode.toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                {sidebarOpen && isOps && (
                    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-3 gap-1">
                        <div className="text-xs font-semibold text-slate-400 mb-2 px-3">WORKSPACE</div>
                        <SidebarItem icon={MapIcon} label="Map Operations" active />
                        <SidebarItem icon={LayoutDashboard} label="Decisions" />
                        <SidebarItem icon={History} label="Timeline" />

                        <div className="text-xs font-semibold text-slate-400 mt-4 mb-2 px-3">GOVERNANCE</div>
                        <SidebarItem icon={FileText} label="Evidence & Audit" />
                        <SidebarItem icon={Settings} label="Settings" />
                    </aside>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
