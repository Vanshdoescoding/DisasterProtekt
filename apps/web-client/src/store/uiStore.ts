import { create } from 'zustand';
import { logClientEvent } from '@/shared/logger';

interface UIState {
    mode: 'ops' | 'briefing';
    sidebarOpen: boolean;
    activeLayerIds: string[];

    // Actions
    setMode: (mode: 'ops' | 'briefing') => void;
    toggleSidebar: () => void;
    toggleLayer: (layerId: string) => void;
}

export const uiStoreDefaults = {
    mode: 'ops' as const,
    sidebarOpen: true,
    activeLayerIds: ['heat', 'power', 'traffic'] as string[],
};

export const useUIStore = create<UIState>((set) => ({
    ...uiStoreDefaults,

    setMode: (mode) => {
        set({ mode });
    },
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    toggleLayer: (layerId) => set((state) => {
        const isActive = state.activeLayerIds.includes(layerId);
        logClientEvent({ type: 'layer_toggle', layerId, enabled: !isActive });
        return {
            activeLayerIds: isActive
                ? state.activeLayerIds.filter(id => id !== layerId)
                : [...state.activeLayerIds, layerId]
        };
    })
}));
