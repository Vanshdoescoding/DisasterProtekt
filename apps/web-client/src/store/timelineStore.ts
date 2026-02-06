import { create } from 'zustand';
import { clampTick, MAX_SIM_TICK } from '@/features/timeline/timelineSelectors';

interface TimelineState {
    currentTick: number;
    isPlaying: boolean;
    maxTick: number;

    setTick: (tick: number) => void;
    stepBy: (delta: number) => void;
    setPlaying: (playing: boolean) => void;
    setMaxTick: (maxTick: number) => void;
}

export const timelineStoreDefaults = {
    currentTick: 0,
    isPlaying: false,
    maxTick: MAX_SIM_TICK
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
    ...timelineStoreDefaults,

    setTick: (tick) => {
        const maxTick = get().maxTick;
        set({ currentTick: clampTick(tick, maxTick) });
    },
    stepBy: (delta) => {
        const { currentTick, maxTick } = get();
        set({ currentTick: clampTick(currentTick + delta, maxTick) });
    },
    setPlaying: (playing) => set({ isPlaying: playing }),
    setMaxTick: (maxTick) => {
        const currentTick = get().currentTick;
        set({
            maxTick,
            currentTick: clampTick(currentTick, maxTick)
        });
    }
}));
